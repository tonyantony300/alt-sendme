/**
 * Platform-specific style initialization
 * Handles transparency and background colors based on platform capabilities
 */

/**
 * Get the appropriate alpha value for backgrounds based on platform
 * - macOS: 0.4 (supports native vibrancy/blur)
 * - Linux: 1.0 (limited/inconsistent blur support)
 * - Windows: 1.0 (can be enhanced later with blur detection)
 * - Web: 1.0 (no transparency support)
 */
export function getPlatformAlpha(): number {
  // Web always uses alpha = 1 (opaque)
  if (!IS_TAURI) return 1

  // macOS supports native vibrancy effects
  if (IS_MACOS) return 0.4

  // Windows and Linux default to opaque
  // Can be enhanced later with runtime blur detection
  if (IS_WINDOWS || IS_LINUX) return 1

  // Default fallback
  return 1
}

/**
 * Initialize platform-specific CSS custom properties
 * Call this early in app initialization
 */
export function initializePlatformStyles(): void {
  const alpha = getPlatformAlpha()

  // Set the CSS custom properties with platform-appropriate alpha
  const root = document.documentElement

  // Background color with platform-specific alpha
  root.style.setProperty('--app-bg', `rgba(25, 25, 25, ${alpha})`)

  // Main view stays opaque on all platforms for better readability
  root.style.setProperty('--app-main-view', `rgba(25, 25, 25, 1)`)

  // Set body/html backgrounds
  if (IS_TAURI && IS_MACOS) {
    // On macOS with transparency, use transparent backgrounds
    // to let the window vibrancy show through
    root.style.setProperty('--body-bg', 'transparent')
  } else {
    // On other platforms, use the opaque app background
    root.style.setProperty('--body-bg', 'var(--app-bg)')
  }

  console.log(`🎨 Platform styles initialized: ${IS_MACOS ? 'macOS' : IS_WINDOWS ? 'Windows' : IS_LINUX ? 'Linux' : 'Web'} (alpha: ${alpha})`)
}

