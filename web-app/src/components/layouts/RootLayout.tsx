import { Outlet } from 'react-router-dom'
import { AppProviders } from './AppProviders'
import { AppFooter } from '../AppFooter'
import { TitleBar } from '../TitleBar'
import { useTranslation } from '@/i18n'

export function RootLayout() {
	const { t } = useTranslation('common')
	return (
		<AppProviders>
			<main className="h-screen flex flex-col relative glass-background select-none bg-background">
				{IS_LINUX && <TitleBar title={t('appTitle')} />}

				{IS_MACOS && (
					<div className="absolute w-full h-10 z-10" data-tauri-drag-region />
				)}
				<Outlet />
				<AppFooter />
			</main>
		</AppProviders>
	)
}
