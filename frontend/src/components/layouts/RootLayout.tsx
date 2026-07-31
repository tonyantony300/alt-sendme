import { Outlet } from 'react-router-dom'

import { AppFooter } from '../AppFooter'
import { TitleBar } from '../TitleBar'
import { useTranslation } from '@/i18n'
import { AppUpdater } from '../common/AppUpdater'
import { DeviceNodeSync } from '../pairing/DeviceNodeSync'
import { PairedInviteDialog } from '../pairing/PairedInviteDialog'
import { ReceiverProvider } from '../receiver/ReceiverProvider'
import { WindowsContextMenuSync } from '../settings/system-tray/context-menu-toggle'
import { useIsWindowsPortable } from '@/hooks/use-windows-portable'
import {
	IS_ANDROID,
	IS_MOBILE,
	IS_FLATPAK,
	IS_LINUX,
	IS_MACOS,
	IS_PAIRING_CAPABLE,
	IS_TAURI,
	IS_WEB,
	IS_WINDOWS,
} from '@/lib/platform'

export function RootLayout() {
	const { t } = useTranslation('common')
	const { data: isWindowsPortable = false } = useIsWindowsPortable()
	return (
		<ReceiverProvider>
			{IS_TAURI && !IS_MOBILE && !isWindowsPortable && !IS_FLATPAK && (
				<AppUpdater />
			)}
			{IS_WINDOWS && <WindowsContextMenuSync />}
			{IS_PAIRING_CAPABLE && <DeviceNodeSync />}
			{IS_PAIRING_CAPABLE && <PairedInviteDialog />}
			<main
				className={
					IS_WEB
						? 'h-full flex flex-col relative glass-background select-none bg-background'
						: 'h-dvh min-h-screen flex flex-col relative glass-background select-none bg-background'
				}
			>
				{IS_LINUX && !IS_ANDROID && <TitleBar title={t('appTitle')} />}

				{IS_MACOS && (
					<div className="absolute w-full h-10 z-10" data-tauri-drag-region />
				)}
				<Outlet />
				<AppFooter />
			</main>
		</ReceiverProvider>
	)
}
