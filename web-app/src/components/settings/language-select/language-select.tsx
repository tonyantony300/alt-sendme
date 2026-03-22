import { useTranslation } from '../../../i18n'
import { LanguageSwitcher } from '../../LanguageSwitcher'
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from '../../ui/frame'

export function LanguageSelect() {
	const { t } = useTranslation()
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{t('settings.language.title')}</FrameTitle>
			</FrameHeader>
			<FramePanel className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ">
				<div className="flex-1">
					<FrameDescription>
						{t('settings.language.description')}
					</FrameDescription>
				</div>
				<LanguageSwitcher className="w-full sm:w-40" />
			</FramePanel>
		</Frame>
	)
}
