import { Download, File, Image as ImageIcon, Film, Music, Archive, Code, FileText, FileSearch, Folder } from 'lucide-react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { TicketInputProps } from '../../types/receiver'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

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

	const getFileIcon = (mimeType?: string) => {
		if (!mimeType) return <File className="h-6 w-6 text-muted-foreground" />
		if (mimeType === 'inode/directory') return <Folder className="h-6 w-6 text-muted-foreground" />
		if (mimeType.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-muted-foreground" />
		if (mimeType.startsWith('video/')) return <Film className="h-6 w-6 text-muted-foreground" />
		if (mimeType.startsWith('audio/')) return <Music className="h-6 w-6 text-muted-foreground" />
		if (mimeType.startsWith('text/')) return <FileText className="h-6 w-6 text-muted-foreground" />
		if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('gzip')) return <Archive className="h-6 w-6 text-muted-foreground" />
		if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('html') || mimeType.includes('css')) return <Code className="h-6 w-6 text-muted-foreground" />
		if (mimeType === 'application/octet-stream') return <FileSearch className="h-6 w-6 text-muted-foreground" />
		return <File className="h-6 w-6 text-muted-foreground" />
	}

	/**
	 * 
	 * @param bytes length of file
	 * @returns formatted file size
	 */
	const formatFileSize = (bytes: number) => {
		if (bytes <= 0) return '0 B'
		const units = ['B', 'KB', 'MB', 'GB', 'TB']
		const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
		const size = bytes / 1024 ** exponent
		return `${size.toFixed(size < 10 && exponent > 0 ? 1 : 0)} ${units[exponent]}`
	}

	return (
		<div className="space-y-4">
			<div>
				<p className="block text-sm font-medium mb-2">
					{t('common:receiver.saveToFolder')}
				</p>
				<InputGroup onClick={onBrowseFolder}>
					<InputGroupInput
						disabled
						value={savePath || t('common:receiver.noFolderSelected')}
					/>
					<InputGroupAddon align="inline-end">
						<Button disabled={isReceiving} size="xs">
							{t('common:browse')}
						</Button>
					</InputGroupAddon>
				</InputGroup>
			</div>

			<div>
				<p className="block text-sm font-medium mb-2">
					{t('common:receiver.pasteTicket')}
				</p>
				<div className="flex gap-2 p-0.5">
					<Textarea
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
					<div className="w-14 h-14 rounded-md overflow-hidden border bg-muted shrink-0 flex items-center justify-center">
						{previewMetadata.thumbnail ? (
							<img
								src={`data:image/jpeg;base64,${previewMetadata.thumbnail}`}
								alt={previewMetadata.fileName}
								className="w-full h-full object-cover"
							/>
						) : (
							getFileIcon(previewMetadata.mimeType)
						)}
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-sm font-medium truncate">{previewMetadata.fileName}</p>
						<p className="text-xs text-muted-foreground">
							{formatFileSize(previewMetadata.size)}
						</p>
						{previewMetadata.description ? (
							<p className="text-xs text-muted-foreground truncate">
								{previewMetadata.description}
							</p>
						) : null}
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
