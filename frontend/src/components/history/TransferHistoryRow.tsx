import {
	ArrowDownToLine,
	ArrowUpFromLine,
	ChevronDown,
	ExternalLink,
	Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { deviceTypeIcon } from '@/lib/device-icon'
import { canOpenTransfer } from '@/lib/history-open-target'
import { formatReceiveSavePath } from '@/lib/receive-save-path'
import {
	formatTransferDuration,
	formatTransferSpeed,
	resolvePeerLabel,
	summarizeTransferItems,
	type TransferRecord,
} from '@/lib/transfer-history'
import type { TransferTempData } from '@/lib/transfer-history-api'
import { cn, formatFileSize } from '@/lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { FramePanel } from '../ui/frame'

interface KnownDevice {
	endpoint_id: string
	display_name: string
}

const STATUS_VARIANT: Record<
	TransferRecord['status'],
	'default' | 'secondary' | 'destructive' | 'outline'
> = {
	completed: 'secondary',
	failed: 'destructive',
	cancelled: 'outline',
	interrupted: 'destructive',
	inProgress: 'outline',
}

/** Short, stable stand-in for a device that never told us its name. */
function shortFingerprint(endpointId: string): string {
	return endpointId.slice(0, 8)
}

function useRelativeTime(timestamp: number): string {
	const { i18n } = useTranslation()
	const formatter = new Intl.RelativeTimeFormat(i18n.language, {
		numeric: 'auto',
	})
	const deltaSeconds = (timestamp - Date.now()) / 1000
	const units: [Intl.RelativeTimeFormatUnit, number][] = [
		['year', 31_536_000],
		['month', 2_592_000],
		['day', 86_400],
		['hour', 3_600],
		['minute', 60],
	]

	for (const [unit, seconds] of units) {
		if (Math.abs(deltaSeconds) >= seconds) {
			return formatter.format(Math.round(deltaSeconds / seconds), unit)
		}
	}
	return formatter.format(Math.round(deltaSeconds), 'second')
}

export function TransferHistoryRow({
	record,
	pairedDevices,
	tempData,
	onRemove,
	onOpen,
	onClearTempData,
	isBusy,
}: {
	record: TransferRecord
	pairedDevices: KnownDevice[]
	tempData?: TransferTempData
	onRemove: (record: TransferRecord) => void
	onOpen: (record: TransferRecord) => void
	onClearTempData: (id: string) => void
	isBusy: boolean
}) {
	const { t } = useTranslation()
	const relativeTime = useRelativeTime(record.startedAt)

	const summary = summarizeTransferItems(record)
	const title =
		summary.kind === 'named'
			? summary.name
			: summary.kind === 'counted'
				? t('common:history.row.items', { count: summary.count })
				: t('common:history.row.unknownItem')

	const peerLabel = resolvePeerLabel(record, pairedDevices)
	const peerText =
		record.peerCount > 1
			? t('common:history.row.devices', { count: record.peerCount })
			: (peerLabel ??
				(record.peer
					? shortFingerprint(record.peer.endpointId)
					: t('common:history.row.unknownDevice')))

	const duration = formatTransferDuration(record.durationMs)
	const speed = formatTransferSpeed(record.avgSpeedBps)

	const [expanded, setExpanded] = useState(false)
	const isSend = record.direction === 'send'
	const DirectionIcon = isSend ? ArrowUpFromLine : ArrowDownToLine
	const PeerIcon = deviceTypeIcon(record.peer?.deviceType)

	// Trimmed the same way the receive screen trims it, so one folder does not
	// read two ways on Android.
	const savePath = formatReceiveSavePath(record.savePath)
	const canOpen = canOpenTransfer(record)
	const writeTime = formatTransferDuration(record.exportMs)
	// Whether the panel has anything *besides* delete to show.
	const hasDetails = Boolean(
		duration ||
			speed ||
			writeTime ||
			savePath ||
			record.error ||
			record.conflictCount > 0
	)

	return (
		<FramePanel className="flex flex-col gap-1 p-2.5 sm:p-2.5">
			{/* The two summary lines are one big toggle: a stretched button covers
			    them so the whole card opens, while the row's own actions sit above
			    it on z-10. The details panel is left uncovered so its paths and
			    error text stay selectable. */}
			<div className="relative flex flex-col gap-1">
				<button
					type="button"
					aria-expanded={expanded}
					className="absolute inset-0 cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
					onClick={() => setExpanded((open) => !open)}
				>
					<span className="sr-only">
						{t('common:history.row.toggleDetails')}
					</span>
				</button>

				<div className="flex min-w-0 items-center gap-2.5">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
						<DirectionIcon className="h-4 w-4" aria-hidden="true" />
						<span className="sr-only">
							{isSend
								? t('common:history.row.directionSent')
								: t('common:history.row.directionReceived')}
						</span>
					</div>

					<p className="min-w-0 flex-1 truncate font-medium text-sm">{title}</p>

					<Badge
						className="shrink-0"
						size="sm"
						variant={STATUS_VARIANT[record.status]}
					>
						{t(`common:history.status.${record.status}`)}
					</Badge>

					<span className="flex size-7 shrink-0 items-center justify-center text-muted-foreground sm:size-6">
						<ChevronDown
							aria-hidden="true"
							className={cn(
								'h-3.5 w-3.5 transition-transform',
								expanded && 'rotate-180'
							)}
						/>
					</span>
				</div>

				{/* Collapsed, a row answers "what, with whom, when, how big"; timing,
				    throughput and destination live behind the toggle. */}
				<div className="flex min-w-0 items-center gap-1.5 text-xs">
					<PeerIcon
						className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
						aria-hidden="true"
					/>
					<span className="shrink-0 truncate font-medium">{peerText}</span>
					<span className="min-w-0 truncate text-muted-foreground">
						{relativeTime} · {formatFileSize(record.payloadBytes)}
					</span>

					<div className="relative z-10 ml-auto flex shrink-0 items-center gap-1">
						{tempData?.exists && (
							<Button
								variant="outline"
								size="xs"
								disabled={isBusy}
								onClick={() => onClearTempData(record.id)}
							>
								{t('common:history.temp.clearSized', {
									size: formatFileSize(tempData.sizeBytes),
								})}
							</Button>
						)}
						{canOpen && (
							<Button
								variant="outline"
								size="xs"
								disabled={isBusy}
								onClick={() => onOpen(record)}
							>
								<ExternalLink />
								{t('common:history.row.open')}
							</Button>
						)}
					</div>
				</div>
			</div>

			{expanded && (
				<div className="flex flex-col gap-2 border-t pt-2">
					{hasDetails && (
						<dl className="grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
							{duration && (
								<div>
									<dt className="text-muted-foreground">
										{t('common:history.row.duration')}
									</dt>
									<dd>{duration}</dd>
								</div>
							)}
							{speed && (
								<div>
									<dt className="text-muted-foreground">
										{t('common:history.row.speed')}
									</dt>
									<dd>{speed}</dd>
								</div>
							)}
							{writeTime && (
								<div>
									<dt className="text-muted-foreground">
										{t('common:history.row.writeTime')}
									</dt>
									<dd>{writeTime}</dd>
								</div>
							)}
							{savePath && (
								<div className="min-w-0 sm:col-span-2">
									<dt className="text-muted-foreground">
										{t('common:history.row.savedTo')}
									</dt>
									<dd className="break-all">{savePath}</dd>
								</div>
							)}
							{record.conflictCount > 0 && (
								<div className="sm:col-span-2">
									<dd className="text-muted-foreground">
										{t('common:history.row.conflicts', {
											count: record.conflictCount,
										})}
									</dd>
								</div>
							)}
							{record.error && (
								<div className="min-w-0 sm:col-span-2">
									<dt className="text-muted-foreground">
										{t('common:history.row.error')}
									</dt>
									<dd className="break-words">{record.error}</dd>
								</div>
							)}
						</dl>
					)}

					{/* Destructive, so it sits away from the row's own controls. */}
					<div className="flex justify-end">
						<Button
							variant="ghost"
							size="icon-xs"
							disabled={isBusy}
							aria-label={t('common:history.row.remove')}
							onClick={() => onRemove(record)}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			)}
		</FramePanel>
	)
}
