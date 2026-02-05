import { useEffect } from 'react'
import { StopCircleIcon } from 'lucide-react'
import { DragDrop } from './DragDrop'
import { ShareActionCard } from './ShareActionCard'
import { SharingActiveCard } from './SharingActiveCard'
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
import { useSender } from '../../hooks/useSender'
import { useTranslation } from '../../i18n/react-i18next-compat'
import { Button } from '../ui/button'
import { useSenderStore } from '../../store/sender-store'

interface SenderProps {
	onTransferStateChange: (isSharing: boolean) => void
}

export function Sender({ onTransferStateChange }: SenderProps) {
	const {
		viewState,
		isSharing,
		isTransporting,
		ticket,
		selectedPath,
		pathType,
		isLoading,
		copySuccess,
		alertDialog,
		transferMetadata,
		transferProgress,
		isBroadcastMode,
		activeConnectionCount,
		handleFileSelect,
		startSharing,
		stopSharing,
		copyTicket,
		closeAlert,
		resetForNewTransfer,
		toggleBroadcastMode,
	} = useSender()

	const { t } = useTranslation()
	const setIsBroadcastMode = useSenderStore((state) => state.setIsBroadcastMode)

	// Debug logging
	useEffect(() => {
		// console.log('[Sender] viewState changed:', viewState, {
		// 	isSharing,
		// 	isTransporting,
		// 	transferMetadata: !!transferMetadata,
		// 	transferMetadataDetails: transferMetadata ? {
		// 		fileName: transferMetadata.fileName,
		// 		wasStopped: transferMetadata.wasStopped,
		// 	} : null,
		// 	isBroadcastMode,
		// 	selectedPath,
		// })

		// Warn if SUCCESS state without metadata
		if (viewState === 'SUCCESS' && !transferMetadata) {
			console.error(
				'[Sender] ⚠️ INVALID STATE: SUCCESS without transferMetadata!',
				{
					viewState,
					transferMetadata,
					isSharing,
					isTransporting,
					selectedPath,
				}
			)
		}
	}, [viewState, isSharing, isTransporting, transferMetadata, selectedPath])

	useEffect(() => {
		onTransferStateChange(isSharing)
	}, [isSharing, onTransferStateChange])

	// Reset broadcast mode to false when idle screen is shown
	useEffect(() => {
		if (viewState === 'IDLE' && isBroadcastMode) {
			setIsBroadcastMode(false)
		}
	}, [viewState, isBroadcastMode, setIsBroadcastMode])

	return (
		<div
			className="p-6 space-y-6 relative h-112 overflow-y-auto flex flex-col"
			style={{ color: 'var(--app-main-view-fg)' }}
		>
			{/* IDLE state: Show file selection UI */}
			{viewState === 'IDLE' && (
				<>
					<div className="text-center">
						<h2 className="text-xl font-semibold mb-2">
							{t('common:sender.title')}
						</h2>
						<p className="text-sm text-muted-foreground">
							{t('common:sender.subtitle')}
						</p>
					</div>
					<div className="space-y-4 flex-1 flex flex-col">
						<DragDrop
							onFileSelect={handleFileSelect}
							selectedPath={selectedPath}
							isLoading={isLoading}
						/>

						<ShareActionCard
							selectedPath={selectedPath}
							isLoading={isLoading}
							onFileSelect={handleFileSelect}
							onStartSharing={startSharing}
						/>
					</div>
				</>
			)}

			{/* SUCCESS state: Show transfer success screen (only in non-broadcast mode) */}
			{viewState === 'SUCCESS' && transferMetadata && !isBroadcastMode && (
				<div className="flex-1 flex flex-col">
					<TransferSuccessScreen
						metadata={transferMetadata}
						onDone={resetForNewTransfer}
					/>
				</div>
			)}

			{/* SHARING or TRANSPORTING state: Show active sharing UI */}
			{/* In broadcast mode, only show SHARING state (skip TRANSPORTING) */}
			{(((viewState === 'SHARING' || viewState === 'TRANSPORTING') &&
				!isBroadcastMode) ||
				(viewState === 'SHARING' && isBroadcastMode)) && (
				<>
					<div className="text-center">
						<PulseAnimation
							isTransporting={isTransporting && !isBroadcastMode}
							hasActiveConnections={
								isBroadcastMode && activeConnectionCount > 0
							}
							className="mx-auto my-4 flex items-center justify-center"
						/>
					</div>
					<div className="flex-1 flex flex-col">
						<SharingActiveCard
							isSharing={isSharing}
							isLoading={isLoading}
							isTransporting={isTransporting && !isBroadcastMode}
							isCompleted={false}
							selectedPath={selectedPath}
							pathType={pathType}
							ticket={ticket}
							copySuccess={copySuccess}
							transferProgress={transferProgress}
							isBroadcastMode={isBroadcastMode}
							activeConnectionCount={activeConnectionCount}
							onStartSharing={startSharing}
							onStopSharing={stopSharing}
							onCopyTicket={copyTicket}
							onToggleBroadcast={toggleBroadcastMode}
						/>
					</div>
				</>
			)}

			{/* Fallback: Show debug info if no view matches */}
			{viewState !== 'IDLE' &&
				viewState !== 'SUCCESS' &&
				viewState !== 'SHARING' &&
				viewState !== 'TRANSPORTING' && (
					<div className="text-center p-4 border border-red-500">
						<p className="text-red-500 font-bold">
							Unexpected view state: {viewState}
						</p>
						<p className="text-sm">
							isSharing={String(isSharing)}, isTransporting=
							{String(isTransporting)}
						</p>
					</div>
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
							render={
								<Button variant="secondary" size="sm">
									{t('common:cancel')}
								</Button>
							}
						/>
						<AlertDialogClose
							onClick={() => {
								stopSharing()
								closeAlert()
							}}
							render={
								<Button size="sm">
									{t('common:sender.stopSharing')}
									<StopCircleIcon />
								</Button>
							}
						/>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
