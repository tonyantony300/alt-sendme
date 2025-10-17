// Tauri API wrapper for type safety
import { invoke } from '@tauri-apps/api/core'

export interface TauriCommands {
  start_sharing: (path: string) => Promise<string>
  stop_sharing: () => Promise<void>
  receive_file: (ticket: string) => Promise<string>
  get_sharing_status: () => Promise<string | null>
}

// Type-safe wrapper for Tauri commands
export const tauriCommands: TauriCommands = {
  start_sharing: (path: string) => invoke('start_sharing', { path }),
  stop_sharing: () => invoke('stop_sharing'),
  receive_file: (ticket: string) => invoke('receive_file', { ticket }),
  get_sharing_status: () => invoke('get_sharing_status'),
}
