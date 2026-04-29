import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-dialog'
import { selectSendDocument, selectSendFolder } from '@/plugins/nativeUtils'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from '../i18n/react-i18next-compat'
import type { AlertDialogState, AlertType } from '../types/ui'
import { IS_ANDROID } from '@/lib/platform'

export interface UseDragDropReturn {
	isDragActive: boolean
	pathType: 'file' | 'directory' | null
	showFullPath: boolean
	alertDialog: AlertDialogState

	toggleFullPath: () => void
	browseFile: () => Promise<void>
	addMoreFiles: () => Promise<void>
	addMoreFolders: () => Promise<void>
	browseFolder: () => Promise<void>
	showAlert: (title: string, description: string, type?: AlertType) => void
	closeAlert: () => void
	checkPathType: (
		path: string,
		pathType?: 'file' | 'directory'
	) => Promise<void>
}

export function useDragDrop(
	onFileSelect: (
		path: string,
		pathType?: 'file' | 'directory'
	) => void | Promise<void>,
	onFilesSelect?: (
		paths: string[],
		pathType?: 'file' | 'directory'
	) => void | Promise<void>
): UseDragDropReturn {
	const { t } = useTranslation()
	const [isDragActive, setIsDragActive] = useState(false)
	const [pathType, setPathType] = useState<'file' | 'directory' | null>(null)
	const [showFullPath, setShowFullPath] = useState(false)
	const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
		isOpen: false,
		title: '',
		description: '',
		type: 'info',
	})

	const showAlert = useCallback(
		(title: string, description: string, type: AlertType = 'info') => {
			setAlertDialog({ isOpen: true, title, description, type })
		},
		[]
	)

	const closeAlert = useCallback(() => {
		setAlertDialog((prev) => ({ ...prev, isOpen: false }))
	}, [])

	const toggleFullPath = useCallback(() => {
		setShowFullPath((prev) => !prev)
	}, [])

	const checkPathType = useCallback(
		async (path: string, pathType?: 'file' | 'directory') => {
			if (pathType) {
				setPathType(pathType)
				return
			}

			try {
				const type = await invoke<string>('check_path_type', { path })
				setPathType(type as 'file' | 'directory')
			} catch (error) {
				console.error('Failed to check path type:', error)
				setPathType(null)
			}
		},
		[]
	)

	const triggerFileSelect = useCallback(
		async (path: string, pathType?: 'file' | 'directory') => {
			try {
				await Promise.resolve(onFileSelect(path, pathType))
			} catch (error) {
				console.error('Failed to handle selected path:', error)
				showAlert(
					t('common:errors.fileDialogFailed'),
					`${t('common:errors.fileDialogFailedDesc')}: ${error}`,
					'error'
				)
			}
		},
		[onFileSelect, showAlert, t]
	)

	const triggerFilesSelect = useCallback(
		async (paths: string[], pathType?: 'file' | 'directory') => {
			if (!paths.length) {
				return
			}

			if (onFilesSelect) {
				try {
					await Promise.resolve(onFilesSelect(paths, pathType))
					return
				} catch (error) {
					console.error('Failed to handle selected paths:', error)
					showAlert(
						t('common:errors.fileDialogFailed'),
						`${t('common:errors.fileDialogFailedDesc')}: ${error}`,
						'error'
					)
					return
				}
			}

			for (const path of paths) {
				await triggerFileSelect(path, pathType)
			}
		},
		[onFilesSelect, showAlert, t, triggerFileSelect]
	)

	const browseFile = useCallback(async () => {
		try {
			if (IS_ANDROID) {
				const selected = await selectSendDocument()

				if (selected) {
					await triggerFilesSelect([selected.cachedPath.toString()], 'file')
				}
			} else {
				const selected = await open({
					multiple: true,
					directory: false,
				})

				if (selected) {
					const paths = Array.isArray(selected) ? selected : [selected]
					await triggerFilesSelect(paths, 'file')
				}
			}
		} catch (error) {
			console.error('Failed to open file dialog:', error)
			showAlert(
				t('common:errors.fileDialogFailed'),
				`${t('common:errors.fileDialogFailedDesc')}: ${error}`,
				'error'
			)
		}
	}, [showAlert, t, triggerFilesSelect])

	const browseFolder = useCallback(async () => {
		try {
			if (IS_ANDROID) {
				const selected = await selectSendFolder()

				if (selected) {
					await triggerFilesSelect(
						[selected.cachedPath.toString()],
						'directory'
					)
				}
			} else {
				const selected = await open({
					multiple: false,
					directory: true,
				})

				if (selected) {
					await triggerFilesSelect([selected], 'directory')
				}
			}
		} catch (error) {
			console.error('Failed to open folder dialog:', error)
			showAlert(
				t('common:errors.folderDialogFailed'),
				`${t('common:errors.folderDialogFailedDesc')}: ${error}`,
				'error'
			)
		}
	}, [showAlert, t, triggerFilesSelect])

	useEffect(() => {
		const window = getCurrentWindow()

		let dropUnlisten: (() => void) | undefined
		let hoverUnlisten: (() => void) | undefined
		let cancelUnlisten: (() => void) | undefined

		window
			.listen<{ paths: string[]; position: { x: number; y: number } }>(
				'tauri://drag-drop',
				(event) => {
					setIsDragActive(false)

					if (event.payload?.paths && event.payload.paths.length > 0) {
						void triggerFilesSelect(event.payload.paths)
					}
				}
			)
			.then((unlisten) => {
				dropUnlisten = unlisten
			})
			.catch((err) => {
				console.error('Failed to register drag-drop listener:', err)
			})

		window
			.listen('tauri://drag-hover', () => {
				setIsDragActive(true)
			})
			.then((unlisten) => {
				hoverUnlisten = unlisten
			})
			.catch((err) => {
				console.error('Failed to register drag-hover listener:', err)
			})

		window
			.listen('tauri://drag-leave', () => {
				setIsDragActive(false)
			})
			.then((unlisten) => {
				cancelUnlisten = unlisten
			})
			.catch((err) => {
				console.error('Failed to register drag-leave listener:', err)
			})

		return () => {
			dropUnlisten?.()
			hoverUnlisten?.()
			cancelUnlisten?.()
		}
	}, [triggerFilesSelect])

	const addMoreFiles = useCallback(async () => {
		await browseFile()
	}, [browseFile])

	const addMoreFolders = useCallback(async () => {
		try {
			if (IS_ANDROID) {
				const selected = await selectSendFolder()

				if (selected) {
					const selectedPath = selected.cachedPath.toString()
					await triggerFilesSelect([selectedPath], 'directory')
					return
				}

				return
			}

			const selected = await open({
				multiple: true,
				directory: true,
			})

			if (!selected) return

			const paths = Array.isArray(selected) ? selected : [selected]
			await triggerFilesSelect(paths, 'directory')
		} catch (error) {
			console.error('Failed to open folders dialog:', error)
			showAlert(
				t('common:errors.folderDialogFailed'),
				`${t('common:errors.folderDialogFailedDesc')}: ${error}`,
				'error'
			)
		}
	}, [showAlert, t, triggerFilesSelect])

	return {
		isDragActive,
		pathType,
		showFullPath,
		alertDialog,

		toggleFullPath,
		browseFile,
		addMoreFiles,
		addMoreFolders,
		browseFolder,
		showAlert,
		closeAlert,
		checkPathType,
	}
}
