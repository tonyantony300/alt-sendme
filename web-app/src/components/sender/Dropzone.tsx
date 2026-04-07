import { AnimatePresence, motion } from 'framer-motion'
import { invoke } from '@tauri-apps/api/core'
import {
	ChevronsLeft,
	ChevronsRight,
	ChevronDown,
	ChevronRight,
	FolderPlus,
	FilePlus,
	Upload,
	X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { DropzoneProps } from '../../types/sender'
import { getPreviewFileIcon } from '../../lib/fileIcons'

const getPathBaseName = (path: string) => {
	const normalized = path.replace(/\\/g, '/')
	return normalized.split('/').pop() ?? path
}

export function Dropzone({
	isDragActive,
	selectedPaths,
	selectedPath,
	pathType,
	showFullPath,
	isLoading,
	onToggleFullPath,
	onAddFiles,
	onAddFolders,
	onRemoveSelectedPath,
	onClearSelection,
}: DropzoneProps) {
	const { t } = useTranslation()
	const hasSelection = selectedPaths.length > 0
	const [mimeTypesByPath, setMimeTypesByPath] = useState<
		Record<string, string>
	>({})
	const previewScrollerRef = useRef<HTMLDivElement | null>(null)
	const previewScrollerCleanupRef = useRef<(() => void) | null>(null)
	const [canScrollLeft, setCanScrollLeft] = useState(false)
	const [canScrollRight, setCanScrollRight] = useState(false)

	useEffect(() => {
		if (!selectedPaths.length) {
			setMimeTypesByPath({})
			return
		}

		let mounted = true
		void (async () => {
			try {
				const mimeTypes = await invoke<(string | null)[]>(
					'get_paths_mime_types',
					{
						paths: selectedPaths,
					}
				)
				if (!mounted) return

				const nextMap: Record<string, string> = {}
				for (const [index, path] of selectedPaths.entries()) {
					const mimeType = mimeTypes[index]
					if (mimeType) nextMap[path] = mimeType
				}
				setMimeTypesByPath(nextMap)
			} catch (error) {
				console.error('Failed to resolve mime types for selected paths:', error)
			}
		})()

		return () => {
			mounted = false
		}
	}, [selectedPaths])

	const updateScrollHints = () => {
		const container = previewScrollerRef.current
		if (!container) {
			setCanScrollLeft(false)
			setCanScrollRight(false)
			return
		}

		const { scrollLeft, scrollWidth, clientWidth } = container
		const maxScrollLeft = scrollWidth - clientWidth
		setCanScrollLeft(scrollLeft > 4)
		setCanScrollRight(maxScrollLeft - scrollLeft > 4)
	}

	const attachPreviewScroller = (node: HTMLDivElement | null) => {
		previewScrollerCleanupRef.current?.()
		previewScrollerCleanupRef.current = null
		previewScrollerRef.current = node

		if (!node) {
			updateScrollHints()
			return
		}

		updateScrollHints()
		node.addEventListener('scroll', updateScrollHints, { passive: true })

		previewScrollerCleanupRef.current = () => {
			node.removeEventListener('scroll', updateScrollHints)
		}
	}

	useEffect(() => {
		const handleResize = () => {
			const container = previewScrollerRef.current
			if (!container) {
				setCanScrollLeft(false)
				setCanScrollRight(false)
				return
			}

			const { scrollLeft, scrollWidth, clientWidth } = container
			const maxScrollLeft = scrollWidth - clientWidth
			setCanScrollLeft(scrollLeft > 4)
			setCanScrollRight(maxScrollLeft - scrollLeft > 4)
		}

		window.addEventListener('resize', handleResize)
		return () => {
			previewScrollerCleanupRef.current?.()
			window.removeEventListener('resize', handleResize)
		}
	}, [])

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
				paddingBottom: '1.5rem',
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
			const firstName = firstPath ? getPathBaseName(firstPath) : ''
			const extraCount = selectedPaths.length - 1
			return (
				<div>
					<div className="font-medium flex items-center justify-center">
						{t('common:sender.multipleItemsSelected', {
							count: extraCount,
							firstName:
								firstName.length > 40
									? `${firstName.slice(0, 40)}…`
									: firstName,
						})}
					</div>
				</div>
			)
		}
		if (selectedPath) {
			const fileName = getPathBaseName(selectedPath)
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

	const renderPathIcon = (path: string) => {
		const fileName = getPathBaseName(path)
		const mimeType = mimeTypesByPath[path]
		return (
			<div className="origin-center scale-[1.85]">
				{getPreviewFileIcon(mimeType, fileName)}
			</div>
		)
	}

	const handlePreviewWheel = (event: React.WheelEvent<HTMLDivElement>) => {
		const container = event.currentTarget
		if (
			Math.abs(event.deltaY) <= Math.abs(event.deltaX) ||
			container.scrollWidth <= container.clientWidth
		) {
			return
		}

		container.scrollLeft += event.deltaY
		event.preventDefault()
	}

	return (
		<motion.div
			layout
			transition={{ duration: 0.3, ease: 'easeInOut' }}
			style={getDropzoneStyles()}
			className="relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-all duration-200 bg-accent text-accent-foreground h-64 border-border overflow-hidden"
		>
			{selectedPath && !isLoading && (
				<div className="absolute top-3 right-3 z-30 flex items-center gap-2 pointer-events-auto">
					<motion.button
						key="add-folder-button"
						type="button"
						initial={{ opacity: 0, filter: 'blur(4px)' }}
						animate={{ opacity: 1, filter: 'blur(0px)' }}
						onClick={(e) => {
							e.stopPropagation()
							void onAddFolders()
						}}
						className="p-1.5 rounded-md text-muted-foreground cursor-pointer"
						aria-label="Add more folders"
					>
						<FolderPlus className="h-6 w-6" />
					</motion.button>
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
						<FilePlus className="h-6 w-6" />
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
				className="h-full w-full"
			>
				{!hasSelection && (
					<div className="h-full w-full flex flex-col items-center justify-center space-y-4">
						<div className="flex justify-center items-center h-16">
							<Upload
								className="h-12 w-12 text-foreground/60 data-active:text-accent-foreground transition-transform"
								data-active={isDragActive ? 'true' : 'false'}
							/>
						</div>

						<div>
							<p className=" hidden sm:block text-lg font-medium mb-2 text-accent-foreground">
								{getStatusText()}
							</p>
							<div className="text-sm truncate text-muted-foreground">
								{getSubText()}
							</div>
						</div>
					</div>
				)}

				<AnimatePresence initial={false}>
					{hasSelection && (
						<motion.div
							key="selected-files-preview"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 6 }}
							transition={{ duration: 0.2 }}
							className="h-full w-full flex flex-col justify-center pt-12"
						>
							<div className="relative">
								{canScrollLeft ? (
									<div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-12 items-center justify-start bg-gradient-to-r from-accent via-accent/90 to-transparent pl-1">
										<ChevronsLeft className="h-4 w-4 text-muted-foreground/80" />
									</div>
								) : null}
								{canScrollRight ? (
									<div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-12 items-center justify-end bg-gradient-to-l from-accent via-accent/90 to-transparent pr-1">
										<ChevronsRight className="h-4 w-4 text-muted-foreground/80" />
									</div>
								) : null}
								<div
									ref={attachPreviewScroller}
									className="overflow-x-auto overflow-y-hidden pb-3 px-1"
									onWheel={handlePreviewWheel}
								>
									<motion.div
										layout
										className="inline-flex min-w-full justify-center gap-3 pr-3"
									>
										<AnimatePresence initial={false}>
											{selectedPaths.map((path) => {
												const fileName = getPathBaseName(path)
												return (
													<motion.div
														key={path}
														layout
														initial={{ opacity: 0, scale: 0.94 }}
														animate={{ opacity: 1, scale: 1 }}
														exit={{ opacity: 0, scale: 0.94 }}
														transition={{ duration: 0.16 }}
														className="group relative w-44 shrink-0"
													>
														<div className="p-1">
															<div className="relative flex h-36 w-full items-center justify-center overflow-hidden">
																{renderPathIcon(path)}
																<button
																	type="button"
																	onClick={(e) => {
																		e.stopPropagation()
																		onRemoveSelectedPath(path)
																	}}
																	className="absolute right-2 top-2 z-10 rounded-full border bg-background p-1 text-muted-foreground opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
																	aria-label={`Remove ${fileName}`}
																	title="Remove from sharing"
																>
																	<X className="h-3.5 w-3.5" />
																</button>
															</div>
														</div>

														<p className="mt-2 truncate text-base text-foreground">
															{fileName}
														</p>
													</motion.div>
												)
											})}
										</AnimatePresence>
									</motion.div>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</motion.div>
	)
}
