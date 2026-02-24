import { invoke } from '@tauri-apps/api/core'

export type SelectDonwloadFolderResponse = {
	uri: String
	path: String
}

export type SelectedSendItemResponse = {
	uri: String
	path: String
	cachedPath: String
}

export async function selectDownloadFolder(): Promise<SelectDonwloadFolderResponse | null> {
	return await invoke<SelectDonwloadFolderResponse>(
		'plugin:native-utils|select_download_folder'
	)
}

export async function selectSendDocument(): Promise<SelectedSendItemResponse | null> {
	return await invoke<SelectedSendItemResponse>(
		'plugin:native-utils|select_send_document'
	)
}

export async function selectSendFolder(): Promise<SelectedSendItemResponse | null> {
	return await invoke<SelectedSendItemResponse>(
		'plugin:native-utils|select_send_folder'
	)
}
