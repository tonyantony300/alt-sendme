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
  // Unimplemented commands are not declared: Tauri rejects a call to a missing
  // method with an error, which is what we want until each one is ported.

  private var pickingSession: FilePickingSession?

  @objc func select_send_document(_ invoke: Invoke) {
    selectAndCopy(invoke, contentTypes: [.content])
  }

  @objc func select_send_folder(_ invoke: Invoke) {
    selectAndCopy(invoke, contentTypes: [.folder])
  }

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
        startCopy(of: url, channel: args.channel)
        invoke.resolve(true)
      }
      self.pickingSession = session
      session.start(on: parentVC)
    }
  }
}

/// Copies a picked file or folder into `Caches/file_cache/<timestamp>/`,
/// matching where Android stages them, and reports it through `channel`.
private func startCopy(of source: URL, channel: Channel) {
  Task.detached {
    let fileManager = FileManager.default
    let folder = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("file_cache")
      .appendingPathComponent(String(Int(Date().timeIntervalSince1970 * 1000)))

    // The picker hands out the original item (`asCopy: false`), which is only
    // readable while security-scoped access is held.
    let accessing = source.startAccessingSecurityScopedResource()
    defer { if accessing { source.stopAccessingSecurityScopedResource() } }

    do {
      try fileManager.createDirectory(at: folder, withIntermediateDirectories: true)
      let target = folder.appendingPathComponent(source.lastPathComponent)

      // Coordinating the read makes File Provider / iCloud items download
      // first; the block runs once they are available locally.
      var coordinationError: NSError?
      var copyError: Error?
      NSFileCoordinator().coordinate(readingItemAt: source, error: &coordinationError) { readURL in
        do {
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
    } catch {
      try? fileManager.removeItem(at: folder)
      try? channel.send(CopyFailure(error: error.localizedDescription))
    }
  }
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
    // `asCopy: false` so files and folders take the same path through `startCopy`.
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

@_cdecl("init_plugin_native_utils")
func initPlugin() -> Plugin {
  return NativeUtilsPlugin()
}
