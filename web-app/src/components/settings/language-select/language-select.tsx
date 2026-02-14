import { useTranslation } from '../../../i18n'
import { LanguageSwitcher } from '../../LanguageSwitcher'
import { Frame, FrameDescription, FramePanel, FrameTitle } from '../../ui/frame'

export function LanguageSelect() {
	const { t } = useTranslation()
	return (
		<Frame>
			<FramePanel className="flex items-center justify-between">
				<div className="flex-1">
					<FrameTitle>{t('settings.language.title')}</FrameTitle>
					<FrameDescription>
						{t('settings.language.description')}
					</FrameDescription>
				</div>
				<LanguageSwitcher className="w-40" />
			</FramePanel>
		</Frame>
	)
}
