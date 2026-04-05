import { Download } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import { getPreviewFileIcon } from '../../lib/fileIcons'
import { formatFileSize } from '../../lib/utils'
import type { TicketInputProps } from '../../types/receiver'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { IS_ANDROID } from '../../lib/platform'

const formatDisplayPath = (path: string | undefined | null) => {
	if (!path) return ''

	if (!IS_ANDROID) return path

	const normalized = path.replace(/\\/g, '/')
	const segments = normalized.split('/').filter(Boolean)

	if (segments.length <= 2) return segments.join('/')

	return segments.slice(-2).join('/')
}

export function TicketInput({
	ticket,
	isReceiving,
	savePath,
	previewMetadata,
	isPreviewLoading,
	onTicketChange,
	onBrowseFolder,
	onReceive,
}: TicketInputProps) {
	const { t } = useTranslation()
	const [failedThumbnailKey, setFailedThumbnailKey] = useState<string | null>(
		null
	)
	const previewThumbnailKey =
		previewMetadata?.thumbnail && previewMetadata?.fileName
			? `${previewMetadata.fileName}:${previewMetadata.thumbnail}`
			: null
	const previewThumbnailSrc = previewMetadata?.thumbnail
		? previewMetadata.thumbnail.startsWith('data:')
			? previewMetadata.thumbnail
			: `data:image/jpeg;base64,${previewMetadata.thumbnail}`
		: null
	const previewDisplayName =
		previewMetadata && previewMetadata.itemCount > 1
			? t('common:receiver.previewMultipleItems', {
					name: previewMetadata.fileName,
					count: previewMetadata.itemCount - 1,
				})
			: previewMetadata?.fileName

	return (
		<div className="space-y-4">
			<div>
				<p className="block text-sm font-medium mb-2">
					{t('common:receiver.saveToFolder')}
				</p>
				<InputGroup onClick={onBrowseFolder}>
					<InputGroupInput
						disabled
						value={
							formatDisplayPath(savePath) ||
							t('common:receiver.noFolderSelected')
						}
					/>
					<InputGroupAddon align="inline-end">
						<Button disabled={isReceiving} size="xs">
							{t('common:browse')}
						</Button>
					</InputGroupAddon>
				</InputGroup>
			</div>

			<div>
				<p id="ticket-input-label" className="block text-sm font-medium mb-2">
					{t('common:receiver.pasteTicket')}
				</p>
				<div className="flex gap-2 p-0.5">
					<Textarea
						aria-labelledby="ticket-input-label"
						value={ticket}
						onChange={(e) => onTicketChange(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault()
								if (ticket.trim() && !isReceiving) {
									onReceive()
								}
							}
						}}
						placeholder={t('common:receiver.ticketPlaceholder')}
						className="font-mono"
						rows={6}
					/>
				</div>
			</div>

			{/*Show loading state when fetching preview metadata */}
			{isPreviewLoading && ticket.trim() && !previewMetadata ? (
				<div className="p-3 rounded-md border bg-muted/40 text-sm text-muted-foreground">
					{t('common:receiver.connectingToSender')}
				</div>
			) : null}

			{/* Show preview if metadata is available*/}
			{previewMetadata ? (
				<div className="p-3 rounded-md border bg-card flex gap-3 items-center">
					<div className="w-14 h-14 rounded-md border bg-muted shrink-0 flex items-center justify-center relative overflow-hidden">
						{previewThumbnailSrc &&
						previewThumbnailKey !== failedThumbnailKey ? (
							<img
								src={previewThumbnailSrc}
								alt={previewMetadata.fileName}
								className="w-full h-full object-cover"
								onError={() => setFailedThumbnailKey(previewThumbnailKey)}
							/>
						) : (
							getPreviewFileIcon(
								previewMetadata.mimeType,
								previewMetadata.fileName
							)
						)}
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium truncate">
							{previewDisplayName}
						</p>
						<p className="text-xs text-muted-foreground">
							{formatFileSize(previewMetadata.size)}
						</p>
					</div>
				</div>
			) : null}

			<Button
				type="button"
				onClick={onReceive}
				disabled={!ticket.trim() || isReceiving}
				className="w-full"
			>
				{t('common:receiver.download')} <Download className="h-8 w-8" />
			</Button>
		</div>
	)
}
