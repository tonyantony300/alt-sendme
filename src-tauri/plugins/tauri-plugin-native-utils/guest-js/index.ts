import { invoke } from '@tauri-apps/api/core'

export type SelectPathResponse = {
  uri: String,
  path: String,
};

export async function selectDownloadFolder(): Promise<SelectPathResponse | null> {
  return await invoke<SelectPathResponse>('plugin:native-utils|select_download_folder');
}
