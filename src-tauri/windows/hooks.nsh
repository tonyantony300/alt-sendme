; Explorer context-menu registry cleanup for NSIS installers.
; The app registers the verb in HKCU at runtime; uninstallers must remove
; both HKCU and any leftover HKLM keys from older MSI builds.
; Safe to run during upgrades — the new build re-syncs from settings on launch.
; Also clears the pre-rename "Send with AltSendme" verb.

!macro NSIS_HOOK_PREUNINSTALL
  DetailPrint "Removing Explorer context menu entries..."

  DeleteRegKey HKCU "Software\Classes\*\shell\Send with DashBeam"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\Send with DashBeam"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\Send with DashBeam"

  DeleteRegKey HKLM "Software\Classes\*\shell\Send with DashBeam"
  DeleteRegKey HKLM "Software\Classes\Directory\shell\Send with DashBeam"
  DeleteRegKey HKLM "Software\Classes\Directory\Background\shell\Send with DashBeam"

  DeleteRegKey HKCU "Software\Classes\*\shell\Send with AltSendme"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\Send with AltSendme"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\Send with AltSendme"

  DeleteRegKey HKLM "Software\Classes\*\shell\Send with AltSendme"
  DeleteRegKey HKLM "Software\Classes\Directory\shell\Send with AltSendme"
  DeleteRegKey HKLM "Software\Classes\Directory\Background\shell\Send with AltSendme"

  ; Also clear via SHCTX in case install mode used a redirected hive.
  DeleteRegKey SHCTX "Software\Classes\*\shell\Send with DashBeam"
  DeleteRegKey SHCTX "Software\Classes\Directory\shell\Send with DashBeam"
  DeleteRegKey SHCTX "Software\Classes\Directory\Background\shell\Send with DashBeam"
  DeleteRegKey SHCTX "Software\Classes\*\shell\Send with AltSendme"
  DeleteRegKey SHCTX "Software\Classes\Directory\shell\Send with AltSendme"
  DeleteRegKey SHCTX "Software\Classes\Directory\Background\shell\Send with AltSendme"
!macroend
