import { useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from '../../../i18n'
import { useAppSettingStore } from '../../../store/app-setting'
import { FrameDescription, FrameTitle } from '../../ui/frame'
import { Switch } from '../../ui/switch'

export function ContextMenuToggle() {
	const { t } = useTranslation()
	const enabled = useAppSettingStore((s) => s.windowsContextMenu)
	const setEnabled = useAppSettingStore((s) => s.setWindowsContextMenu)

	// biome-ignore lint/correctness/useExhaustiveDependencies: only runs on mount
	useEffect(() => {
		invoke('toggle_context_menu', { enable: enabled }).catch((e) =>
			console.error('Failed to sync context menu state:', e)
		)
	}, [])

	const handleChange = (value: boolean) => {
		setEnabled(value)
		invoke('toggle_context_menu', { enable: value }).catch((e) =>
			console.error('Failed to toggle context menu:', e)
		)
	}

	return (
		<div className="flex items-center justify-between">
			<div className="flex-1">
				<FrameTitle>
					{t('settings.general.systembar.contextMenu.label')}
				</FrameTitle>
				<FrameDescription>
					{t('settings.general.systembar.contextMenu.description')}
				</FrameDescription>
			</div>
			<Switch checked={enabled} onCheckedChange={handleChange} />
		</div>
	)
}
