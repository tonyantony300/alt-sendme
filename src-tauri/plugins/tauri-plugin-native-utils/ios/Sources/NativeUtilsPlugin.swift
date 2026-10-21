import QuickLook
import Tauri
import UIKit
import UniformTypeIdentifiers
import WebKit

// iOS side of the native-utils plugin. Each command in ../../src/mobile.rs
// (`run_mobile_plugin("<name>", ...)`) dispatches to the `@objc` method of
// the same name here. The Kotlin implementation in ../../android is the
// reference for what each should do.

struct SelectorArgs: Decodable {
  let channel: Channel
}

struct CancelJobArgs: Decodable {
  let channelId: UInt64
}

struct OpenDownloadFolderArgs: Decodable {
  let treeUri: String
}

struct OpenDownloadTargetArgs: Decodable {
  let uri: String
  let relativePath: String
}

struct DownloadFolderSelectionResponse: Encodable {
  /// The folder's `file://` URL; on Android this is the SAF tree URI.
  let uri: String
  let path: String
}

struct CopyProgress: Encodable {
  let copiedBytes: String
  let totalBytes: String
  let cachedPath: String?
  let cachedPaths: String?
  let completed: Bool
  let progress: Double
}

struct CopyFailure: Encodable {
  let error: String
  var progress: Double = -1
  var copiedBytes = "0"
  var totalBytes = "0"
}

class NativeUtilsPlugin: Plugin {
  // Commands with no method here (export_to_tree, export_to_media_store,
  // write_text_to_uri, fetch_update_manifest, the presence service and
  // get_window_insets) are Android-only: their callers are behind
  // `cfg(target_os = "android")` or `IS_ANDROID`.

  private static let downloadFolderBookmarkKey = "nativeUtils.downloadFolderBookmark"

  private var pickingSession: FilePickingSession?
  private var previewSession: PreviewSession?

  /// Running copies by channel id, with the folder each stages into, so
  /// `cancel_job` can stop one and clean up after it. Main actor only.
  private var jobs = [UInt64: (task: Task<Void, Never>, folder: URL)]()

  /// The chosen download folder, held open for the life of the process so
  /// Rust can write received files into it with plain `std::fs` calls.
  private var accessedDownloadFolder: URL?

  override func load(webview: WKWebView) {
    super.load(webview: webview)
    restoreDownloadFolderAccess()
  }

  @objc func select_send_document(_ invoke: Invoke) {
    selectAndCopy(invoke, contentTypes: [.content])
  }

  @objc func select_send_folder(_ invoke: Invoke) {
    selectAndCopy(invoke, contentTypes: [.folder])
  }

  @objc func cancel_job(_ invoke: Invoke) {
    let args: CancelJobArgs
    do {
      args = try invoke.parseArgs(CancelJobArgs.self)
    } catch {
      return invoke.reject(error.localizedDescription)
    }

    Task { @MainActor in
      guard let job = self.jobs.removeValue(forKey: args.channelId) else {
        return invoke.reject("Trying to cancel a non existing job")
      }
      // `copyItem` can't be interrupted, so this waits for the current item.
      job.task.cancel()
      await job.task.value
      try? FileManager.default.removeItem(at: job.folder)
      invoke.resolve()
    }
  }

  @objc func select_download_folder(_ invoke: Invoke) {
    Task { @MainActor in
      guard let parentVC = self.manager.viewController else {
        return invoke.reject("Unable to get parent view controller")
      }

      let session = FilePickingSession(contentTypes: [.folder]) { urls in
        self.pickingSession = nil
        // Like Android, a cancelled picker resolves with nothing.
        guard let url = urls?.first else { return invoke.resolve() }

        do {
          try self.setDownloadFolder(url)
          invoke.resolve(DownloadFolderSelectionResponse(uri: url.absoluteString, path: url.path))
        } catch {
          invoke.reject(error.localizedDescription)
        }
      }
      self.pickingSession = session
      session.start(on: parentVC)
    }
  }

  @objc func open_download_folder(_ invoke: Invoke) {
    let args: OpenDownloadFolderArgs
    do {
      args = try invoke.parseArgs(OpenDownloadFolderArgs.self)
    } catch {
      return invoke.reject(error.localizedDescription)
    }

    guard let folder = fileURL(from: args.treeUri) else {
      return invoke.reject("No download folder URI available")
    }

    Task { @MainActor in
      self.openInFiles(folder, invoke: invoke)
    }
  }

  /// Shows a received file in Quick Look, else the folder it landed in in the
  /// Files app. Unlike Android there's no system Downloads list to fall back
  /// on, so with neither given this opens the app's own Documents folder.
  @objc func open_download_target(_ invoke: Invoke) {
    let args: OpenDownloadTargetArgs
    do {
      args = try invoke.parseArgs(OpenDownloadTargetArgs.self)
    } catch {
      return invoke.reject(error.localizedDescription)
    }

    let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let relativePath = args.relativePath.trimmingCharacters(in: CharacterSet(charactersIn: "/ "))

    Task { @MainActor in
      if let file = self.fileURL(from: args.uri), !self.isDirectory(file) {
        return self.preview(file, invoke: invoke)
      }
      let folder =
        self.fileURL(from: args.uri)
        ?? (relativePath.isEmpty ? documents : documents.appendingPathComponent(relativePath))
      self.openInFiles(folder, invoke: invoke)
    }
  }

  // MARK: - Send selection

  private func selectAndCopy(_ invoke: Invoke, contentTypes: [UTType]) {
    let args: SelectorArgs
    do {
      args = try invoke.parseArgs(SelectorArgs.self)
    } catch {
      return invoke.reject(error.localizedDescription)
    }

    Task { @MainActor in
      guard let parentVC = self.manager.viewController else {
        return invoke.reject("Unable to get parent view controller")
      }

      let session = FilePickingSession(contentTypes: contentTypes) { urls in
        // Also breaks the plugin -> session -> closure retain cycle.
        self.pickingSession = nil
        // Like Android: `false` when cancelled, `true` once the copy has started;
        // the file itself arrives through the channel.
        guard let url = urls?.first else { return invoke.resolve(false) }
        self.startCopy(of: url, channel: args.channel)
        invoke.resolve(true)
      }
      self.pickingSession = session
      session.start(on: parentVC)
    }
  }

  /// Copies a picked file or folder into `Caches/file_cache/<timestamp>/`,
  /// matching where Android stages them, and reports it through `channel`.
  @MainActor
  private func startCopy(of source: URL, channel: Channel) {
    let folder = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("file_cache")
      .appendingPathComponent(String(Int(Date().timeIntervalSince1970 * 1000)))

    let task = Task.detached {
      do {
        try stageCopy(of: source, into: folder, channel: channel)
      } catch is CancellationError {
        // `cancel_job` asked for this and cleans up the folder itself.
      } catch {
        try? FileManager.default.removeItem(at: folder)
        try? channel.send(CopyFailure(error: error.localizedDescription))
      }
      await MainActor.run { _ = self.jobs.removeValue(forKey: channel.id) }
    }
    // Registered before the task's own removal can run: that hops back onto
    // the main actor, which is busy here until this returns.
    jobs[channel.id] = (task, folder)
  }

  // MARK: - Download folder

  @MainActor
  private func setDownloadFolder(_ url: URL) throws {
    guard url.startAccessingSecurityScopedResource() else {
      throw CocoaError(.fileReadNoPermission)
    }
    let bookmark = try url.bookmarkData()

    accessedDownloadFolder?.stopAccessingSecurityScopedResource()
    accessedDownloadFolder = url
    UserDefaults.standard.set(bookmark, forKey: Self.downloadFolderBookmarkKey)
  }

  /// Picker access ends with the process; the bookmark saved by
  /// `select_download_folder` restores it on the next launch.
  private func restoreDownloadFolderAccess() {
    let defaults = UserDefaults.standard
    guard let bookmark = defaults.data(forKey: Self.downloadFolderBookmarkKey) else { return }

    var isStale = false
    guard let url = try? URL(resolvingBookmarkData: bookmark, bookmarkDataIsStale: &isStale),
      url.startAccessingSecurityScopedResource()
    else {
      NSLog("native-utils: download folder bookmark no longer resolves")
      return
    }
    if isStale, let refreshed = try? url.bookmarkData() {
      defaults.set(refreshed, forKey: Self.downloadFolderBookmarkKey)
    }
    accessedDownloadFolder = url
  }

  // MARK: - Opening received files

  @MainActor
  private func openInFiles(_ folder: URL, invoke: Invoke) {
    // The Files app opens at a local folder given this scheme. It isn't
    // documented, but is what apps showing their own files use.
    guard
      var components = URLComponents(url: folder, resolvingAgainstBaseURL: false)
    else {
      return invoke.reject("Invalid folder path: \(folder.path)")
    }
    components.scheme = "shareddocuments"
    guard let filesURL = components.url else {
      return invoke.reject("Invalid folder path: \(folder.path)")
    }

    UIApplication.shared.open(filesURL) { opened in
      if opened {
        invoke.resolve()
      } else {
        invoke.reject("No app available to open the downloaded files")
      }
    }
  }

  @MainActor
  private func preview(_ file: URL, invoke: Invoke) {
    guard let parentVC = manager.viewController else {
      return invoke.reject("Unable to get parent view controller")
    }
    let session = PreviewSession(file: file) { [weak self] in self?.previewSession = nil }
    previewSession = session
    session.present(on: parentVC)
    invoke.resolve()
  }

  /// Accepts a `file://` URL or an absolute path, as stored by either side.
  private func fileURL(from string: String) -> URL? {
    let trimmed = string.trimmingCharacters(in: .whitespaces)
    if trimmed.isEmpty { return nil }
    if let url = URL(string: trimmed), url.isFileURL { return url }
    return trimmed.hasPrefix("/") ? URL(fileURLWithPath: trimmed) : nil
  }

  private func isDirectory(_ url: URL) -> Bool {
    (try? url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) == true
  }
}

/// Copies `source` into `folder`, sending Android's start and completion
/// `CopyProgress` messages. Throws `CancellationError` if cancelled meanwhile.
private func stageCopy(of source: URL, into folder: URL, channel: Channel) throws {
  let fileManager = FileManager.default

  // The picker hands out the original item (`asCopy: false`), which is only
  // readable while security-scoped access is held.
  let accessing = source.startAccessingSecurityScopedResource()
  defer { if accessing { source.stopAccessingSecurityScopedResource() } }

  try fileManager.createDirectory(at: folder, withIntermediateDirectories: true)
  let target = folder.appendingPathComponent(source.lastPathComponent)

  // Coordinating the read makes File Provider / iCloud items download
  // first; the block runs once they are available locally.
  var coordinationError: NSError?
  var copyError: Error?
  NSFileCoordinator().coordinate(readingItemAt: source, error: &coordinationError) { readURL in
    do {
      try Task.checkCancellation()
      let size = String(try totalSize(of: readURL))

      // Like Android's first `copyUri` emit: announces the size and destination.
      try channel.send(
        CopyProgress(
          copiedBytes: "0",
          totalBytes: size,
          cachedPath: target.path,
          cachedPaths: nil,
          completed: false,
          progress: 0
        ))

      // Recursive for folders, and a clone when on the same APFS volume.
      try fileManager.copyItem(at: readURL, to: target)
      try Task.checkCancellation()

      try channel.send(
        CopyProgress(
          copiedBytes: size,
          totalBytes: size,
          cachedPath: target.path,
          cachedPaths: nil,
          completed: true,
          progress: 1
        ))
    } catch {
      copyError = error
    }
  }
  if let error = coordinationError ?? copyError { throw error }
}

/// Size of a file, or the summed size of the regular files under a folder.
private func totalSize(of url: URL) throws -> Int {
  let keys: Set<URLResourceKey> = [.isDirectoryKey, .isRegularFileKey, .fileSizeKey]
  let values = try url.resourceValues(forKeys: keys)
  guard values.isDirectory == true else { return values.fileSize ?? 0 }

  var total = 0
  let enumerator = FileManager.default.enumerator(
    at: url, includingPropertiesForKeys: Array(keys))
  while let child = enumerator?.nextObject() as? URL {
    let childValues = try child.resourceValues(forKeys: keys)
    if childValues.isRegularFile == true { total += childValues.fileSize ?? 0 }
  }
  return total
}

@MainActor
class FilePickingSession: NSObject {
  private let contentTypes: [UTType]
  private let completion: ([URL]?) -> Void

  /// `completion` gets the picked URLs, or nil if the user cancelled.
  init(contentTypes: [UTType], completion: @escaping ([URL]?) -> Void) {
    self.contentTypes = contentTypes
    self.completion = completion
  }

  func start(on viewController: UIViewController) {
    // `asCopy: false` so files and folders take the same path through `stageCopy`,
    // and so a picked download folder can be written to in place.
    let picker = UIDocumentPickerViewController(forOpeningContentTypes: contentTypes, asCopy: false)
    picker.delegate = self
    picker.popoverPresentationController?.sourceView = viewController.view
    viewController.present(picker, animated: true)
  }
}

extension FilePickingSession: UIDocumentPickerDelegate {
  func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    completion(nil)
  }

  func documentPicker(
    _ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]
  ) {
    completion(urls)
  }
}

/// Quick Look preview of one file. `QLPreviewController` holds its data source
/// weakly, so this lives on the plugin until the preview is dismissed.
class PreviewSession: NSObject {
  private let file: URL
  private let onDismiss: () -> Void

  init(file: URL, onDismiss: @escaping () -> Void) {
    self.file = file
    self.onDismiss = onDismiss
  }

  @MainActor
  func present(on viewController: UIViewController) {
    let preview = QLPreviewController()
    preview.dataSource = self
    preview.delegate = self
    viewController.present(preview, animated: true)
  }
}

extension PreviewSession: QLPreviewControllerDataSource, QLPreviewControllerDelegate {
  func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }

  func previewController(_ controller: QLPreviewController, previewItemAt index: Int)
    -> QLPreviewItem
  {
    file as NSURL
  }

  func previewControllerDidDismiss(_ controller: QLPreviewController) {
    onDismiss()
  }
}

@_cdecl("init_plugin_native_utils")
func initPlugin() -> Plugin {
  return NativeUtilsPlugin()
}
