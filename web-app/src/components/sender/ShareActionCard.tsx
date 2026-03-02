import { Share2, Type } from 'lucide-react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { ShareActionProps } from '../../types/sender'
import { Button } from '../ui/button'

export function ShareActionCard({
	selectedPath,
	fileDescription,
	isLoading,
	onDescriptionChange,
	onStartSharing,
}: ShareActionProps & { onStartSharing: () => Promise<void> }) {
	const { t } = useTranslation()
	if (!selectedPath) return null

	return (
		<div className="space-y-4">
			<div className="relative">
				<Type className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
				<input
					type="text"
					value={fileDescription}
					onChange={(e) => onDescriptionChange(e.target.value)}
					placeholder={t('common:sender.description')}
					disabled={isLoading}
					className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				/>
			</div>
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
