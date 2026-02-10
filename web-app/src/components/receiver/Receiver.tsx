import { Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useReceiver } from '../../hooks/useReceiver'
import { useTranslation } from '../../i18n/react-i18next-compat'
import { PulseAnimation } from '../common/PulseAnimation'
import { TransferSuccessScreen } from '../common/TransferSuccessScreen'
import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../ui/alert-dialog'
import { ReceivingActiveCard } from './ReceivingActiveCard'
import { TicketInput } from './TicketInput'
import { Button } from '../ui/button'

interface ReceiverProps {
	onTransferStateChange: (isReceiving: boolean) => void
}

export function Receiver({ onTransferStateChange }: ReceiverProps) {
	const [showInstructionsDialog, setShowInstructionsDialog] = useState(false)
	const { t } = useTranslation()

	const {
		ticket,
		isReceiving,
		isTransporting,
		isCompleted,
		savePath,
		alertDialog,
		transferMetadata,
		transferProgress,
		fileNames,
		handleTicketChange,
		handleBrowseFolder,
		handleReceive,
		handleOpenFolder,
		closeAlert,
		resetForNewTransfer,
	} = useReceiver()

	useEffect(() => {
		onTransferStateChange(isReceiving)
	}, [isReceiving, onTransferStateChange])

	return (
		<div className="p-6 space-y-6 relative h-112 overflow-y-auto flex flex-col">
			{!isReceiving ? (
				<>
					<div className="text-center">
						<div className="flex items-center justify-center gap-2 mb-2">
							<h2 className="text-xl font-semibold">
								{t('common:receiver.title')}
							</h2>
							<Button
								size="icon-sm"
								type="button"
								variant="ghost"
								onClick={() => setShowInstructionsDialog(true)}
								className="absolute top-6 right-6"
							>
								<Info />
							</Button>
						</div>
						<p className="text-sm text-muted-foreground">
							{t('common:receiver.subtitle')}
						</p>
					</div>

					<div className="space-y-4 flex-1 flex flex-col">
						<TicketInput
							ticket={ticket}
							isReceiving={isReceiving}
							savePath={savePath}
							onTicketChange={handleTicketChange}
							onBrowseFolder={handleBrowseFolder}
							onReceive={handleReceive}
						/>
					</div>
				</>
			) : isCompleted && transferMetadata ? (
				<div className="flex-1 flex flex-col">
					<TransferSuccessScreen
						metadata={transferMetadata}
						onDone={resetForNewTransfer}
						onOpenFolder={handleOpenFolder}
					/>
				</div>
			) : (
				<>
					<div className="text-center">
						<PulseAnimation
							isTransporting={isTransporting}
							className="mx-auto my-4 flex items-center justify-center"
						/>
					</div>
					<div className="flex-1 flex flex-col">
						<ReceivingActiveCard
							isReceiving={isReceiving}
							isTransporting={isTransporting}
							isCompleted={isCompleted}
							ticket={ticket}
							transferProgress={transferProgress}
							fileNames={fileNames}
							onReceive={handleReceive}
							onStopReceiving={resetForNewTransfer}
						/>
					</div>
				</>
			)}

			<AlertDialog open={alertDialog.isOpen} onOpenChange={closeAlert}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
						<AlertDialogDescription>
							{alertDialog.description}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogClose
							onClick={closeAlert}
							render={<Button size="sm">{t('common:ok')}</Button>}
						/>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={showInstructionsDialog}
				onOpenChange={setShowInstructionsDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t('common:receiver.howToReceive')}
						</AlertDialogTitle>
						<AlertDialogDescription></AlertDialogDescription>
						<ol className="text-sm space-y-2 list-decimal list-inside mt-2">
							<li>{t('common:receiver.instruction1')}</li>
							<li>{t('common:receiver.instruction2')}</li>
							<li>{t('common:receiver.instruction3')}</li>
							<li>{t('common:receiver.instruction4')}</li>
							<li>{t('common:receiver.instruction5')}</li>
						</ol>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogClose
							render={<Button size="sm">{t('common:ok')}</Button>}
							onClick={() => setShowInstructionsDialog(false)}
						></AlertDialogClose>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
