import { Share2 } from 'lucide-react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { ShareActionProps } from '../../types/sender'
import { Button } from '../ui/button'

export function ShareActionCard({
	selectedPath,
	isLoading,
	onStartSharing,
}: ShareActionProps & { onStartSharing: () => Promise<void> }) {
	const { t } = useTranslation()
	if (!selectedPath) return null

	return (
		<div className="">
			<Button
				type="button"
				onClick={onStartSharing}
				disabled={isLoading}
				className="w-full"
			>
				<Share2 className="h-4 w-4 mr-2" />
				{isLoading
					? t('common:sender.startingShare')
					: t('common:sender.startSharing')}
			</Button>
		</div>
	)
}
