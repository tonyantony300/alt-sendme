import { useEffect, useState } from 'react'
import { useTranslation } from '../../../i18n'
import { useAppSettingStore } from '../../../store/app-setting'
import { isAutostartEnabled, setAutostart } from '../../../lib/autostart'
import { FrameDescription, FrameTitle } from '../../ui/frame'
import { Switch } from '../../ui/switch'
import { toastManager } from '../../ui/toast'

export function StartOnStartup() {
	const { t } = useTranslation()
	// The persisted value is only a cache for first paint; the OS decides.
	const cached = useAppSettingStore((r) => r.startOnBoot)
	const setCached = useAppSettingStore((r) => r.setStartOnBoot)
	const [value, setValue] = useState(cached)
	const [busy, setBusy] = useState(false)

	useEffect(() => {
		let disposed = false
		void isAutostartEnabled()
			.then((enabled) => {
				// `null` = the platform can't be asked (Flatpak); keep the cache.
				if (disposed || enabled === null) return
				setValue(enabled)
				setCached(enabled)
			})
			.catch(() => {
				// Leave the cached value on screen; the toggle still works.
			})
		return () => {
			disposed = true
		}
	}, [setCached])

	const toggle = (next: boolean) => {
		setBusy(true)
		void setAutostart(next)
			.then((actual) => {
				// setAutostart resolves to the state the OS actually ended up in,
				// which can differ from what was requested (e.g. a denied Flatpak
				// portal dialog). Compare requested vs actual to tell a normal
				// toggle from a refusal: if they match, the OS did what we asked.
				// If they don't, the OS/user refused — that's not an exception, so
				// warn instead of treating it like a thrown error.
				setValue(actual)
				setCached(actual)
				if (actual !== next) {
					toastManager.add({
						title: t('settings.general.systembar.runOnSystemStartupFailed'),
						type: 'warning',
					})
				}
			})
			.catch(() => {
				setValue(!next)
				toastManager.add({
					title: t('settings.general.systembar.runOnSystemStartupFailed'),
					type: 'warning',
				})
			})
			.finally(() => {
				setBusy(false)
			})
	}

	return (
		<div className="flex items-center justify-between">
			<div className="flex-1">
				<FrameTitle>
					{t('settings.general.systembar.runOnSystemStartup.label')}
				</FrameTitle>
				<FrameDescription>
					{t('settings.general.systembar.runOnSystemStartup.description')}
				</FrameDescription>
			</div>
			<Switch checked={value} disabled={busy} onCheckedChange={toggle} />
		</div>
	)
}
