import { TranslationProvider } from '@/i18n'
import { AppThemeProvider } from '../AppThemeProvider'
import { AnchoredToastProvider, ToastProvider } from '../ui/toast'

export function AppProviders({ children }: { children: React.ReactNode }) {
	return (
		<TranslationProvider>
			<ToastProvider position="bottom-center" limit={1}>
				<AnchoredToastProvider>
					<AppThemeProvider>{children}</AppThemeProvider>
				</AnchoredToastProvider>
			</ToastProvider>
		</TranslationProvider>
	)
}
