import UIKit

/// The share sheet's "DashBeam" entry: saves the shared files with
/// `ShareInbox` for the app to pick up.
///
/// A share extension can't open its app, so once saved this stays up to tell
/// the user to switch to DashBeam rather than vanishing silently.
class ShareViewController: UIViewController {
  private let statusView = ShareStatusView()
  private var saveError: Error?

  override func loadView() {
    view = statusView
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    statusView.doneButton.addTarget(self, action: #selector(done), for: .touchUpInside)
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    let providers = (extensionContext?.inputItems as? [NSExtensionItem] ?? [])
      .flatMap { $0.attachments ?? [] }

    Task {
      do {
        statusView.showSaved(count: try await ShareInbox.save(providers))
      } catch {
        NSLog("DashBeam share extension: \(error)")
        saveError = error
        statusView.showFailure(error)
      }
    }
  }

  @objc private func done() {
    if let saveError {
      extensionContext?.cancelRequest(withError: saveError)
    } else {
      extensionContext?.completeRequest(returningItems: nil)
    }
  }
}
