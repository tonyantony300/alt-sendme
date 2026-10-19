import Tauri
import UIKit
import WebKit

// iOS side of the native-utils plugin. Each command in ../../src/mobile.rs
// (`run_mobile_plugin("<name>", ...)`) dispatches to the `@objc` method of
// the same name here. None are implemented yet; the Kotlin implementation in
// ../../android is the reference for what each should do.
class NativeUtilsPlugin: Plugin {
  // Unimplemented commands are not declared: Tauri rejects a call to a missing
  // method with an error, which is what we want until each one is ported.

  @objc func select_send_document(_ invoke: Invoke) {
      NSLog("test test?")
  }
}

@_cdecl("init_plugin_native_utils")
func initPlugin() -> Plugin {
  return NativeUtilsPlugin()
}
