import UIKit
import UniformTypeIdentifiers

/// The share sheet's "DashBeam" entry. Saves the shared files into the app
/// group's `share_inbox/<timestamp>/<index>/<name>`, where the native-utils
/// plugin's `consume_share_intent` picks them up once the app is open; this
/// mirrors what the Android share intent hands the app.
///
/// A share extension can't open its app, so once saved this stays up to tell
/// the user to switch to DashBeam rather than vanishing silently.
class ShareViewController: UIViewController {
  private let spinner = UIActivityIndicatorView(style: .large)
  private let iconView = UIImageView()
  private let titleLabel = UILabel()
  private let messageLabel = UILabel()
  private let doneButton = UIButton(type: .system)
  private var saveError: Error?

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .systemBackground

    iconView.contentMode = .scaleAspectFit
    iconView.preferredSymbolConfiguration = UIImage.SymbolConfiguration(pointSize: 56)
    titleLabel.font = .preferredFont(forTextStyle: .title2)
    titleLabel.adjustsFontForContentSizeCategory = true
    messageLabel.font = .preferredFont(forTextStyle: .body)
    messageLabel.adjustsFontForContentSizeCategory = true
    messageLabel.textColor = .secondaryLabel
    for label in [titleLabel, messageLabel] {
      label.textAlignment = .center
      label.numberOfLines = 0
    }
    doneButton.setTitle("Done", for: .normal)
    doneButton.titleLabel?.font = .preferredFont(forTextStyle: .headline)
    doneButton.addTarget(self, action: #selector(done), for: .touchUpInside)

    let stack = UIStackView(arrangedSubviews: [
      spinner, iconView, titleLabel, messageLabel, doneButton,
    ])
    stack.axis = .vertical
    stack.alignment = .center
    stack.spacing = 12
    stack.setCustomSpacing(24, after: messageLabel)
    stack.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(stack)
    NSLayoutConstraint.activate([
      stack.centerYAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerYAnchor),
      stack.leadingAnchor.constraint(equalTo: view.layoutMarginsGuide.leadingAnchor),
      stack.trailingAnchor.constraint(equalTo: view.layoutMarginsGuide.trailingAnchor),
    ])

    titleLabel.text = "Preparing files…"
    iconView.isHidden = true
    messageLabel.isHidden = true
    doneButton.isHidden = true
    spinner.startAnimating()
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    Task {
      do {
        let count = try await saveSharedFiles()
        showResult(
          symbol: "checkmark.circle.fill", tint: .systemGreen,
          title: "Ready to send",
          message: count == 1
            ? "Open DashBeam to send this file."
            : "Open DashBeam to send these \(count) files.")
      } catch {
        NSLog("DashBeam share extension: \(error)")
        saveError = error
        showResult(
          symbol: "exclamationmark.triangle.fill", tint: .systemOrange,
          title: "Couldn't add files",
          message: error.localizedDescription)
      }
    }
  }

  private func showResult(symbol: String, tint: UIColor, title: String, message: String) {
    spinner.stopAnimating()
    spinner.isHidden = true
    iconView.image = UIImage(systemName: symbol)
    iconView.tintColor = tint
    iconView.isHidden = false
    titleLabel.text = title
    messageLabel.text = message
    messageLabel.isHidden = false
    doneButton.isHidden = false
  }

  @objc private func done() {
    if let saveError {
      extensionContext?.cancelRequest(withError: saveError)
    } else {
      extensionContext?.completeRequest(returningItems: nil)
    }
  }

  /// Returns how many files were saved.
  private func saveSharedFiles() async throws -> Int {
    let fileManager = FileManager.default
    guard let groupID = Bundle.main.object(forInfoDictionaryKey: "DashBeamAppGroup") as? String,
      let container = fileManager.containerURL(forSecurityApplicationGroupIdentifier: groupID)
    else {
      throw ShareError.noAppGroup
    }

    // Written under a `.partial` name and renamed once complete, so the app
    // never picks up a share that is still being saved.
    let inbox = container.appendingPathComponent("share_inbox")
    let batchName = String(Int(Date().timeIntervalSince1970 * 1000))
    let partial = inbox.appendingPathComponent(batchName + ".partial")
    try fileManager.createDirectory(at: partial, withIntermediateDirectories: true)

    do {
      let providers = (extensionContext?.inputItems as? [NSExtensionItem] ?? [])
        .flatMap { $0.attachments ?? [] }

      var index = 0
      for provider in providers {
        // Highest-fidelity type first, as the provider orders them.
        guard
          let type = provider.registeredTypeIdentifiers.first(where: {
            UTType($0)?.conforms(to: .data) == true
          })
        else { continue }

        let destination = partial.appendingPathComponent(String(index))
        try fileManager.createDirectory(at: destination, withIntermediateDirectories: true)
        try await saveFile(from: provider, type: type, into: destination)
        index += 1
      }
      guard index > 0 else { throw ShareError.nothingToShare }

      try fileManager.moveItem(at: partial, to: inbox.appendingPathComponent(batchName))
      return index
    } catch {
      try? fileManager.removeItem(at: partial)
      throw error
    }
  }

  private func saveFile(from provider: NSItemProvider, type: String, into folder: URL) async throws
  {
    let suggestedName = provider.suggestedName
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      // The URL is a temporary copy that is deleted once this handler returns.
      _ = provider.loadFileRepresentation(forTypeIdentifier: type) { url, error in
        guard let url else {
          return continuation.resume(throwing: error ?? ShareError.nothingToShare)
        }
        do {
          try FileManager.default.copyItem(
            at: url, to: folder.appendingPathComponent(fileName(suggested: suggestedName, at: url)))
          continuation.resume()
        } catch {
          continuation.resume(throwing: error)
        }
      }
    }
  }
}

/// The provider's suggested name (e.g. a Photos asset's `IMG_0001`) reads
/// better than the temporary file's, which is often a UUID.
private func fileName(suggested: String?, at url: URL) -> String {
  guard let suggested, !suggested.isEmpty else {
    return url.lastPathComponent
  }
  if (suggested as NSString).pathExtension.isEmpty, !url.pathExtension.isEmpty {
    return suggested + "." + url.pathExtension
  }
  return suggested
}

enum ShareError: LocalizedError {
  case noAppGroup
  case nothingToShare

  var errorDescription: String? {
    switch self {
    case .noAppGroup: return "DashBeam's shared storage is unavailable"
    case .nothingToShare: return "Nothing that DashBeam can send was shared"
    }
  }
}
