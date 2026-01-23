import { Square } from 'lucide-react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { TransferProgress } from '../../types/transfer'
import { TransferProgressBar } from '../common/TransferProgressBar'
import { StatusIndicator } from '../common/StatusIndicator'
import { Button } from '../ui/button'

interface ReceivingActiveCardProps {
	isReceiving: boolean
	isTransporting: boolean
	isCompleted: boolean
	ticket: string
	transferProgress: TransferProgress | null
	fileNames: string[]
	onReceive: () => Promise<void>
	onStopReceiving: () => Promise<void>
}

export function ReceivingActiveCard({
	isTransporting,
	isCompleted,
	transferProgress,
	onStopReceiving,
}: ReceivingActiveCardProps) {
	const { t } = useTranslation()

	const getStatusText = () => {
		if (isCompleted) return t('common:receiver.downloadCompleted')
		if (isTransporting) return t('common:receiver.downloadingInProgress')
		return t('common:receiver.connectingToSender')
	}

	const statusText = getStatusText()

	return (
		<div className="space-y-4">
			<div className="p-4 rounded-lg absolute top-0 left-0">
				<StatusIndicator
					isCompleted={isCompleted}
					isTransporting={isTransporting}
					statusText={statusText}
				/>
			</div>

			<p className="text-xs text-center">{t('common:receiver.keepAppOpen')}</p>

			{isTransporting && transferProgress && (
				<TransferProgressBar progress={transferProgress} />
			)}

			<Button
				variant={'destructive-outline'}
				size="icon-lg"
				type="button"
				onClick={onStopReceiving}
				className="absolute top-0 right-6 rounded-full"
				aria-label="Stop receiving"
			>
				<Square className="w-4 h-4" fill="currentColor" />
			</Button>
		</div>
	)
}
