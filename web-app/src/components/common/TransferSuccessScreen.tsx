import {
	CheckCircle,
	CoffeeIcon,
	ExternalLinkIcon,
	XCircle,
} from 'lucide-react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import { handleExternalLinkClick } from '../../lib/openExternalUrl'
import { DONATE_LINK } from '../../lib/version'
import { formatFileSize } from '../../lib/utils'
import type { SuccessScreenProps } from '../../types/transfer'
import { Button } from '../ui/button'

function formatDuration(ms: number): string {
	if (ms === 0) {
		return 'NA'
	} else if (ms < 1000) {
		return `${ms}ms`
	} else if (ms < 60000) {
		return `${(ms / 1000).toFixed(1)}s`
	} else {
		const minutes = Math.floor(ms / 60000)
		const seconds = ((ms % 60000) / 1000).toFixed(1)
		return `${minutes}m ${seconds}s`
	}
}

function formatSpeed(bytesPerSecond: number): string {
	if (bytesPerSecond === 0) return 'NA'

	const mbps = bytesPerSecond / (1024 * 1024)
	const kbps = bytesPerSecond / 1024

	if (mbps >= 1) {
		return `${mbps.toFixed(2)} MB/s`
	} else {
		return `${kbps.toFixed(2)} KB/s`
	}
}

function calculateAverageSpeed(
	fileSizeBytes: number,
	durationMs: number
): number {
	if (durationMs === 0) return 0
	const durationSeconds = durationMs / 1000
	return fileSizeBytes / durationSeconds
}

export function TransferSuccessScreen({
	metadata,
	onDone,
	onOpenFolder,
}: SuccessScreenProps) {
	const wasStopped = metadata.wasStopped || false
	const isReceiver = !!metadata.downloadPath
	const isDirectory = metadata.pathType === 'directory'
	const { t } = useTranslation()

	return (
		<div className="flex flex-col items-center justify-center space-y-6 ">
			<div className="flex items-center justify-center">
				{wasStopped ? (
					<XCircle size={44} className="text-destructive" />
				) : (
					<CheckCircle size={44} className="text-success" />
				)}
			</div>

			<div className="text-center">
				<h2 className="text-2xl font-semibold mb-2">
					{wasStopped
						? t('common:transfer.stopped')
						: t('common:transfer.complete')}
				</h2>
				<p className="text-sm text-muted-foreground">
					{wasStopped
						? t('common:transfer.wasStopped')
						: t('common:transfer.successMessage')}
				</p>
			</div>

			<div className="bg-opacity-10 rounded-lg p-4 w-full max-w-full">
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium mr-2">
							{metadata.itemCount && metadata.itemCount > 1
								? t('common:transfer.files')
								: isDirectory
									? t('common:transfer.folder')
									: t('common:transfer.file')}
							:
						</span>
						<span
							className="text-sm truncate max-w-full"
							title={metadata.fileName}
						>
							{metadata.itemCount && metadata.itemCount > 1
								? t('common:transfer.multipleFiles', {
										count: metadata.itemCount,
									})
								: metadata.fileName}
						</span>
					</div>

					{metadata.downloadPath && (
						<div className="flex justify-between items-center">
							<span className="text-sm font-medium mr-2">
								{t('common:transfer.downloadPath')}:
							</span>
							<span
								className="text-sm truncate max-w-full"
								title={metadata.downloadPath}
							>
								{metadata.downloadPath}
							</span>
						</div>
					)}

					<div className="flex justify-between items-center">
						<span className="text-sm font-medium mr-2">
							{isDirectory
								? t('common:transfer.folderSize')
								: t('common:transfer.fileSize')}
							:
						</span>
						<span className="text-sm">
							{wasStopped
								? 'NA'
								: formatFileSize(metadata.fileSize, {
										zeroValue: 'NA',
										precision: 1,
										smallPrecision: 1,
									})}
						</span>
					</div>

					<div className="flex justify-between items-center">
						<span className="text-sm font-medium mr-2">
							{t('common:transfer.duration')}:
						</span>
						<span className="text-sm">
							{wasStopped ? 'NA' : formatDuration(metadata.duration)}
						</span>
					</div>

					<div className="flex justify-between items-center">
						<span className="text-sm font-medium mr-2">
							{t('common:transfer.avgSpeed')}:
						</span>
						<span className="text-sm">
							{wasStopped
								? 'NA'
								: formatSpeed(
										calculateAverageSpeed(metadata.fileSize, metadata.duration)
									)}
						</span>
					</div>
				</div>
			</div>

			{isReceiver && onOpenFolder ? (
				<div className="flex gap-3 w-full max-w-sm">
					<Button
						type="button"
						variant="secondary"
						onClick={onOpenFolder}
						className="flex-1 hidden sm:flex"
					>
						<ExternalLinkIcon size={12} />
						{t('common:transfer.open')}
					</Button>
					<Button type="button" className="flex-1" onClick={onDone}>
						{t('common:transfer.done')}
					</Button>
				</div>
			) : (
				<Button type="button" className="w-full" onClick={onDone}>
					{t('common:transfer.done')}
				</Button>
			)}

			{!wasStopped ? (
				<p className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-xs sm:text-sm text-muted-foreground">
					<span>{t('common:transfer.donatePrompt')}</span>
					<a
						href={DONATE_LINK}
						onClick={(event) => handleExternalLinkClick(event, DONATE_LINK)}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 font-medium text-foreground/70 underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary/60"
					>
						<CoffeeIcon size={14} aria-hidden />
						{t('common:donate')}
					</a>
				</p>
			) : null}
		</div>
	)
}
