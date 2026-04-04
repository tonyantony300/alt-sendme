import { motion } from 'framer-motion'
import { ChevronDown, ChevronRight, Plus, Upload, X } from 'lucide-react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { DropzoneProps } from '../../types/sender'
import { FolderIcon, getFileIcon } from '../illustration'

export function Dropzone({
	isDragActive,
	selectedPaths,
	selectedPath,
	pathType,
	showFullPath,
	isLoading,
	onToggleFullPath,
	onAddFiles,
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
		if (selectedPaths.length > 1) return t('common:sender.itemSelected')
		if (selectedPath) {
			if (pathType === 'directory') return t('common:sender.folderSelected')
			if (pathType === 'file') return t('common:sender.fileSelected')
			return t('common:sender.itemSelected')
		}
		return t('common:sender.dragAndDrop')
	}

	const getSubText = () => {
		if (isLoading) return t('common:sender.pleaseWaitProcessing')
		if (selectedPaths.length > 1) {
			const firstPath = selectedPaths[0]
			const firstName = firstPath?.split('/').pop() ?? ''
			const extraCount = selectedPaths.length - 1
			return (
				<div>
					<div className="font-medium flex items-center justify-center">
						{`${firstName} ... 等${extraCount}个文件`}
					</div>
				</div>
			)
		}
		if (selectedPath) {
			const fileName = selectedPath.split('/').pop() ?? ''
			const displayName =
				fileName.length > 60 ? `${fileName.slice(0, 60)}…` : fileName
			return (
				<div>
					<div
						className="font-medium cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
						onClick={onToggleFullPath}
						title="Click to toggle full path"
					>
						{displayName}
						<span className="-mr-2 hidden sm:block ">
							{showFullPath ? (
								<ChevronDown className="p-0.5 h-6 w-6" size={16} />
							) : (
								<ChevronRight className="p-0.5 h-6 w-6" size={16} />
							)}
						</span>
					</div>
					<div
						className="text-xs mt-1 opacity-75 break-all transition-opacity max-sm:hidden"
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
		<motion.div
			layout
			transition={{ duration: 0.3, ease: 'easeInOut' }}
			style={getDropzoneStyles()}
			className="relative border-2 border-dashed rounded-lg p-16 text-center cursor-pointer transition-all duration-200 bg-accent text-accent-foreground flex items-center justify-center h-64 border-border"
		>
			{selectedPath && !isLoading && (
				<div className="absolute top-3 right-3 flex items-center gap-2">
					<motion.button
						key="add-button"
						type="button"
						initial={{ opacity: 0, filter: 'blur(4px)' }}
						animate={{ opacity: 1, filter: 'blur(0px)' }}
						onClick={(e) => {
							e.stopPropagation()
							void onAddFiles()
						}}
						className="p-1.5 rounded-md text-muted-foreground cursor-pointer"
						aria-label="Add more files"
					>
						<Plus className="h-6 w-6" />
					</motion.button>
					<motion.button
						key="clear-button"
						type="button"
						initial={{ opacity: 0, filter: 'blur(4px)' }}
						animate={{ opacity: 1, filter: 'blur(0px)' }}
						onClick={(e) => {
							e.stopPropagation()
							onClearSelection()
						}}
						className="p-1.5 rounded-md text-muted-foreground cursor-pointer"
						aria-label="Clear selection"
					>
						<X className="h-6 w-6" />
					</motion.button>
				</div>
			)}
			<motion.div
				key={selectedPath ? 'selected' : 'empty'}
				initial={{ opacity: 0, filter: 'blur(4px)' }}
				animate={{ opacity: 1, filter: 'blur(0px)' }}
				exit={{ opacity: 0, filter: 'blur(4px)' }}
				transition={{ duration: 0.25 }}
				className="space-y-4 w-full"
			>
				<div className="flex justify-center items-center h-16">
					{selectedPath ? (
						renderSuccessIcon()
					) : (
						<Upload
							className="h-12 w-12 text-foreground/60 data-active:text-accent-foreground transition-transform"
							data-active={isDragActive ? 'true' : 'false'}
						/>
					)}
				</div>

				<div>
					<p className=" hidden sm:block text-lg font-medium mb-2 text-accent-foreground">
						{getStatusText()}
					</p>
					<div className="text-sm truncate text-muted-foreground">
						{getSubText()}
					</div>
				</div>
			</motion.div>
		</motion.div>
	)
}
