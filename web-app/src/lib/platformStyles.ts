export function getPlatformAlpha(): number {
  if (!IS_TAURI) return 1

  if (IS_MACOS) return 0.4

  if (IS_WINDOWS || IS_LINUX) return 1

  return 1
}

export function initializePlatformStyles(): void {
  const alpha = getPlatformAlpha()

  const root = document.documentElement

  root.style.setProperty('--app-bg', `rgba(25, 25, 25, ${alpha})`)

  root.style.setProperty('--app-main-view', `rgba(25, 25, 25, 1)`)

  if (IS_TAURI && IS_MACOS) {
    root.style.setProperty('--body-bg', 'transparent')
  } else {
    root.style.setProperty('--body-bg', 'var(--app-bg)')
  }
}

