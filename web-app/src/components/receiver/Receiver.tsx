import { Info } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
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
	onTransferStateChange?: (isReceiving: boolean) => void
	initialTicket?: string | null
}

export function Receiver({
	onTransferStateChange,
	initialTicket,
}: ReceiverProps) {
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
		previewMetadata,
		isPreviewLoading,
		fileNames,
		handleTicketChange,
		handleBrowseFolder,
		handleReceive,
		handleOpenFolder,
		closeAlert,
		resetForNewTransfer,
	} = useReceiver()

	const processedTicketRef = useRef<string | null>(null)

	useEffect(() => {
		if (!ticket) {
			processedTicketRef.current = null
		}
	}, [ticket])

	// Handle initial ticket from deep link
	useEffect(() => {
		if (initialTicket && initialTicket !== processedTicketRef.current) {
			console.debug(
				'[Receiver] Auto-filling ticket from deep link:',
				initialTicket
			)
			processedTicketRef.current = initialTicket
			handleTicketChange(initialTicket)
		}
	}, [initialTicket, handleTicketChange])

	// Listen for deep-link events and auto-fill ticket
	useEffect(() => {
		let disposed = false
		const cleanupFns: UnlistenFn[] = []

		const setupListener = async () => {
			try {
				const unlistenDeepLink = await listen<{
					action: string
					ticket?: string
				}>('deep-link', (event) => {
					const { action, ticket } = event.payload
					if (action === 'receive' && ticket) {
						console.debug('[Receiver] Deep-link ticket received:', ticket)
						if (ticket !== processedTicketRef.current) {
							processedTicketRef.current = ticket
							handleTicketChange(ticket)
						}
					}
				})

				if (disposed) {
					unlistenDeepLink()
					return
				}

				cleanupFns.push(unlistenDeepLink)
			} catch (error) {
				cleanupFns.forEach((unlisten) => unlisten())
				console.debug(
					'[Receiver] Note: Tauri deep-link listener not available',
					error
				)
			}
		}

		void setupListener()

		return () => {
			disposed = true
			cleanupFns.forEach((unlisten) => unlisten())
		}
	}, [handleTicketChange])

	useEffect(() => {
		if (onTransferStateChange) {
			onTransferStateChange(isReceiving)
		}
	}, [isReceiving, onTransferStateChange])

	return (
		<div className="p-2 sm:p-6 space-y-6 relative h-[62dvh] sm:h-112 overflow-y-auto flex flex-col">
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
								className="absolute top-0 right-0 sm:top-6 sm:right-6"
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
							previewMetadata={previewMetadata}
							isPreviewLoading={isPreviewLoading}
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
