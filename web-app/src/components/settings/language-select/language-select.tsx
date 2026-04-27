import { useTranslation } from '../../../i18n'
import { LanguageSwitcher } from '../../LanguageSwitcher'
import {
	Frame,
	FrameDescription,
	FramePanel,
	FrameTitle,
	FrameHeader,
} from '../../ui/frame'
import { LazyIcon } from '../../icons'

export function LanguageSelect() {
	const { t } = useTranslation()
	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>
					<LazyIcon
						name="Translate"
						weight="fill"
						size={20}
						className="inline-block mr-2 opacity-75 sm:hidden"
					/>
					{t('settings.language.title')}
				</FrameTitle>
			</FrameHeader>
			<FramePanel className="flex items-start justify-between flex-col sm:flex-row sm:pt-4 gap-1 sm:gap-0">
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
