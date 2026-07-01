// Platform flags derived from import.meta.env.TAURI_PLATFORM (injected by Vite define at build time).
// Using import.meta.env ensures replacement works in dev and build.
const platform = import.meta.env.TAURI_PLATFORM ?? ''

export const IS_TAURI = platform.length > 0
export const IS_ANDROID = platform.includes('android')
export const IS_MACOS = platform.includes('darwin')
export const IS_WINDOWS = platform.includes('windows')
export const IS_LINUX = platform.includes('linux')
