import { useState } from 'react'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { SharingControlsProps } from '../../types/sender'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetPanel,
	SheetTitle,
} from '../ui/sheet'
import { PairedDevicesPanel } from './PairedDevicesPanel'
import { ShareLinkPanel } from './ShareLinkPanel'

export function SharingActiveCard({
	selectedPaths,
	selectedPath,
	ticket,
	copySuccess,
	transferProgress,
	isTransporting,
	isCompleted,
	isBroadcastMode,
	activeConnectionCount = 0,
	pairedDevices = [],
	isNodeReady = false,
	isNodeStatusPending = false,
	pairedInviteStatus = {},
	onInvitePairedDevice,
	onInviteNearbyDevice,
	onCopyTicket,
	onStopSharing,
	onSetBroadcast,
}: SharingControlsProps) {
	const { t } = useTranslation()
	const [devicesOpen, setDevicesOpen] = useState(IS_PAIRING_CAPABLE)

	return (
		<>
			<ShareLinkPanel
				selectedPaths={selectedPaths}
				selectedPath={selectedPath}
				ticket={ticket}
				copySuccess={copySuccess}
				isTransporting={isTransporting}
				isCompleted={isCompleted}
				isBroadcastMode={isBroadcastMode}
				activeConnectionCount={activeConnectionCount}
				transferProgress={transferProgress}
				onCopyTicket={onCopyTicket}
				onSetBroadcast={onSetBroadcast}
				onStopSharing={onStopSharing}
				showPairedDevicesOption={IS_PAIRING_CAPABLE && !devicesOpen}
				onOpenPairedDevices={() => setDevicesOpen(true)}
			/>

			{IS_PAIRING_CAPABLE ? (
				<Sheet open={devicesOpen} onOpenChange={setDevicesOpen}>
					<SheetContent side="right" inset className="sm:max-w-sm">
						<SheetHeader>
							<SheetTitle>
								{t('common:sender.sharingActive.devices.title')}
							</SheetTitle>
							<SheetDescription>
								{t('common:sender.sharingActive.devices.hint')}
							</SheetDescription>
						</SheetHeader>
						<SheetPanel
							scrollFade={false}
							className="flex h-full min-h-0 flex-col overflow-hidden !pt-0 !pb-4"
						>
							<PairedDevicesPanel
								pairedDevices={pairedDevices}
								pairedInviteStatus={pairedInviteStatus}
								isNodeReady={isNodeReady}
								isNodeStatusPending={isNodeStatusPending}
								hasTicket={Boolean(ticket)}
								onInvitePairedDevice={onInvitePairedDevice}
								onInviteNearbyDevice={onInviteNearbyDevice}
								onInviteSuccess={() => setDevicesOpen(false)}
								showHeader={false}
								showSearch
								isOpen={devicesOpen}
							/>
						</SheetPanel>
					</SheetContent>
				</Sheet>
			) : null}
		</>
	)
}
