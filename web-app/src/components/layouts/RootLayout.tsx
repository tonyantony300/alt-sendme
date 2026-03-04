import { Outlet } from 'react-router-dom'

import { AppFooter } from '../AppFooter'
import { TitleBar } from '../TitleBar'
import { useTranslation } from '@/i18n'
import { AppUpdater } from '../common/AppUpdater'
import { IS_ANDROID, IS_LINUX, IS_MACOS } from '@/lib/platform'

export function RootLayout() {
	const { t } = useTranslation('common')
	return (
		<>
			{!IS_ANDROID && <AppUpdater />}
			<main className="h-screen flex flex-col relative glass-background select-none bg-background">
				{IS_LINUX && !IS_ANDROID && <TitleBar title={t('appTitle')} />}

				{IS_MACOS && (
					<div className="absolute w-full h-10 z-10" data-tauri-drag-region />
				)}
				<Outlet />
				<AppFooter />
			</main>
		</>
	)
}
