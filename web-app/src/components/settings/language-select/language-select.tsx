import { useTranslation } from '../../../i18n'
import { LanguageSwitcher } from '../../LanguageSwitcher'
import {
	Frame,
	FrameDescription,
	FramePanel,
	FrameTitle,
	FrameHeader,
} from '../../ui/frame'

export function LanguageSelect() {
	const { t } = useTranslation()
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{t('settings.language.title')}</FrameTitle>
			</FrameHeader>
			<FramePanel className="flex items-center justify-between">
				<div className="flex-1">
					<FrameDescription>
						{t('settings.language.description')}
					</FrameDescription>
				</div>
				<LanguageSwitcher className="w-40" />
			</FramePanel>
		</Frame>
	)
}
