import { ChevronDown, ChevronRight, Loader2, Upload, X } from 'lucide-react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { DropzoneProps } from '../../types/sender'
import { FolderIcon, getFileIcon } from '../illustration'

export function Dropzone({
	isDragActive,
	selectedPath,
	pathType,
	showFullPath,
	isLoading,
	onToggleFullPath,
	onClearSelection,
}: DropzoneProps) {
	const { t } = useTranslation()
	const getDropzoneStyles = () => {
		const baseStyles: React.CSSProperties = {}

		if (isDragActive) {
			return {
				...baseStyles,
				borderColor: 'var(--info)',
				backgroundColor: 'color-mix(in srgb, var(--info) 10%, transparent)',
			}
		}

		if (selectedPath && !isLoading) {
			return {
				...baseStyles,
				paddingBottom: '2rem',
			}
		}

		if (isLoading) {
			return {
				...baseStyles,
				paddingBottom: '4rem',
			}
		}

		return baseStyles
	}

	const getStatusText = () => {
		if (isLoading) return t('common:sender.preparingForTransport')
		if (isDragActive) return t('common:sender.dropFilesHere')
		if (selectedPath) {
			if (pathType === 'directory') return t('common:sender.folderSelected')
			if (pathType === 'file') return t('common:sender.fileSelected')
			return t('common:sender.itemSelected')
		}
		return t('common:sender.dragAndDrop')
	}

	const getSubText = () => {
		if (isLoading) return t('common:sender.pleaseWaitProcessing')
		if (selectedPath) {
			return (
				<div>
					<div
						className="font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
						onClick={onToggleFullPath}
						title="Click to toggle full path"
					>
						{selectedPath.split('/').pop()}
						<span className="-mr-2">
							{showFullPath ? (
								<ChevronDown className="p-0.5 h-6 w-6" size={16} />
							) : (
								<ChevronRight className="p-0.5 h-6 w-6" size={16} />
							)}
						</span>
					</div>
					<div
						className="text-xs mt-1 opacity-75 break-all transition-opacity"
						style={{
							visibility: showFullPath ? 'visible' : 'hidden',
						}}
					>
						{selectedPath}
					</div>
				</div>
			)
		}
		return t('common:sender.orBrowse')
	}

	const renderSuccessIcon = () => {
		if (pathType === 'directory') return <FolderIcon />

		const fileExtension = selectedPath
			? selectedPath.split('.').pop()?.toLowerCase()
			: null
		if (!fileExtension) return null

		const icon = getFileIcon(fileExtension)
		if (!icon) return null

		const IconComponent = icon
		return <IconComponent />
	}

	return (
		<div
			style={getDropzoneStyles()}
			className="relative border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-all duration-200 bg-accent text-accent-foreground flex items-center justify-center min-h-48 border-border"
		>
			{selectedPath && !isLoading && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation()
						onClearSelection()
					}}
					className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground cursor-pointer"
					aria-label="Clear selection"
				>
					<X className="h-6 w-6" />
				</button>
			)}
			<div className="space-y-4 w-full">
				<div className="flex justify-center">
					{isLoading ? (
						<Loader2 className="h-12 w-12 animate-spin" />
					) : selectedPath ? (
						renderSuccessIcon()
					) : (
						<Upload
							className="h-12 w-12 text-foreground/60 data-active:text-accent-foreground transition-transform"
							data-active={isDragActive ? 'true' : 'false'}
						/>
					)}
				</div>

				<div>
					<p className="text-lg font-medium mb-2 text-accent-foreground">
						{getStatusText()}
					</p>
					<div className="text-sm text-muted-foreground">{getSubText()}</div>
				</div>
			</div>
		</div>
	)
}
