import { ChevronDown, ChevronUp, Download } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import { getPreviewFileIcon } from '../../lib/fileIcons'
import { formatFileSize } from '../../lib/utils'
import type { TicketInputProps } from '../../types/receiver'
import type { TicketPreviewMetadata } from '../../types/transfer'
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

const getThumbnailSrc = (thumbnail?: string) => {
	if (!thumbnail) return null
	return thumbnail.startsWith('data:')
		? thumbnail
		: `data:image/jpeg;base64,${thumbnail}`
}

function TicketPreviewCard({
	previewMetadata,
}: {
	previewMetadata: TicketPreviewMetadata
}) {
	const { t } = useTranslation()
	const [failedThumbnailKeys, setFailedThumbnailKeys] = useState<
		Record<string, true>
	>({})
	const [isPreviewListExpanded, setIsPreviewListExpanded] = useState(false)

	const previewThumbnailKey =
		previewMetadata.thumbnail && previewMetadata.fileName
			? `${previewMetadata.fileName}:${previewMetadata.thumbnail}`
			: null
	const isCollectionPreview =
		previewMetadata.itemCount > 1 ||
		previewMetadata.mimeType === 'application/x-iroh-collection'
	const previewThumbnailSrc = isCollectionPreview
		? null
		: getThumbnailSrc(previewMetadata.thumbnail)
	const previewItems = previewMetadata.items ?? []
	const canExpandPreviewList = previewItems.length > 1
	const previewDisplayName =
		canExpandPreviewList && isPreviewListExpanded
			? t('common:receiver.multipleFilesFound')
			: previewMetadata.itemCount > 1
				? t('common:receiver.previewMultipleItems', {
						name: previewMetadata.fileName,
						count: previewMetadata.itemCount - 1,
					})
				: previewMetadata.fileName

	const hasFailedThumbnail = (key: string | null) =>
		Boolean(key && failedThumbnailKeys[key])

	const markThumbnailFailed = (key: string | null) => {
		if (!key) return
		setFailedThumbnailKeys((prev) => ({ ...prev, [key]: true }))
	}

	return (
		<div className="rounded-md border bg-card overflow-hidden">
			<div className="p-3 flex gap-3 items-center">
				<div className="w-14 h-14 rounded-md border bg-muted shrink-0 flex items-center justify-center relative overflow-hidden">
					{previewThumbnailSrc && !hasFailedThumbnail(previewThumbnailKey) ? (
						<img
							src={previewThumbnailSrc}
							alt={previewMetadata.fileName}
							className="w-full h-full object-cover"
							onError={() => markThumbnailFailed(previewThumbnailKey)}
						/>
					) : (
						getPreviewFileIcon(
							isCollectionPreview
								? 'application/x-iroh-collection'
								: previewMetadata.mimeType,
							previewMetadata.fileName
						)
					)}
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-medium truncate">{previewDisplayName}</p>
					<p className="text-xs text-muted-foreground">
						{formatFileSize(previewMetadata.size)}
					</p>
				</div>
				{canExpandPreviewList ? (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="shrink-0 h-8 w-8"
						aria-label={
							isPreviewListExpanded
								? t('common:receiver.collapsePreviewList')
								: t('common:receiver.expandPreviewList')
						}
						onClick={() => setIsPreviewListExpanded((expanded) => !expanded)}
					>
						{isPreviewListExpanded ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</Button>
				) : null}
			</div>
			{canExpandPreviewList && isPreviewListExpanded ? (
				<div className="border-t bg-muted/20">
					<div className="max-h-64 overflow-y-auto p-2 space-y-2">
						{previewItems.map((item) => {
							const itemThumbnailKey =
								item.thumbnail && item.fileName
									? `${item.fileName}:${item.thumbnail}`
									: null
							const itemThumbnailSrc = getThumbnailSrc(item.thumbnail)

							return (
								<div
									key={item.fileName}
									className="flex items-center gap-3 rounded-md border bg-card px-2 py-2"
								>
									<div className="w-12 h-12 rounded-md border bg-muted shrink-0 flex items-center justify-center overflow-hidden">
										{itemThumbnailSrc &&
										!hasFailedThumbnail(itemThumbnailKey) ? (
											<img
												src={itemThumbnailSrc}
												alt={item.fileName}
												className="w-full h-full object-cover"
												onError={() => markThumbnailFailed(itemThumbnailKey)}
											/>
										) : (
											getPreviewFileIcon(item.mimeType, item.fileName)
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium break-all line-clamp-2">
											{item.fileName}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatFileSize(item.size)}
										</p>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			) : null}
		</div>
	)
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
	const previewMetadataKey = previewMetadata
		? JSON.stringify(previewMetadata)
		: 'no-preview'

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
				<TicketPreviewCard
					key={previewMetadataKey}
					previewMetadata={previewMetadata}
				/>
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
