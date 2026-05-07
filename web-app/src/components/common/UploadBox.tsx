import { useEffect, useRef, useState } from 'react'

export interface UploadItem {
	file: File
	name: string
	path: string
	size: number
	type: string
	lastModified: number
}

interface UploadBoxProps {
	onUpload?: (items: UploadItem[]) => void
}

function mapFilesToUploadItems(files: File[]): UploadItem[] {
	return files.map((file) => ({
		file,
		name: file.name,
		path: file.webkitRelativePath || file.name,
		size: file.size,
		type: file.type || 'application/octet-stream',
		lastModified: file.lastModified,
	}))
}

function readFileEntry(entry: FileSystemFileEntry): Promise<File> {
	return new Promise((resolve, reject) => {
		entry.file(resolve, reject)
	})
}

function readDirectoryEntries(
	entry: FileSystemDirectoryEntry
): Promise<FileSystemEntry[]> {
	return new Promise((resolve, reject) => {
		const reader = entry.createReader()
		const allEntries: FileSystemEntry[] = []

		const readBatch = () => {
			reader.readEntries((entries) => {
				if (entries.length === 0) {
					resolve(allEntries)
					return
				}
				allEntries.push(...entries)
				readBatch()
			}, reject)
		}

		readBatch()
	})
}

async function readEntryRecursively(entry: FileSystemEntry): Promise<File[]> {
	if (entry.isFile) {
		const file = await readFileEntry(entry as FileSystemFileEntry)
		return [file]
	}

	if (entry.isDirectory) {
		const children = await readDirectoryEntries(
			entry as FileSystemDirectoryEntry
		)
		const nestedFiles = await Promise.all(children.map(readEntryRecursively))
		return nestedFiles.flat()
	}

	return []
}

export default function UploadBox({ onUpload }: UploadBoxProps) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const folderInputRef = useRef<HTMLInputElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [isDragging, setIsDragging] = useState(false)

	useEffect(() => {
		const folderInput = folderInputRef.current
		if (!folderInput) return

		folderInput.setAttribute('webkitdirectory', '')
		folderInput.setAttribute('directory', '')
	}, [])

	useEffect(() => {
		if (!isMenuOpen) return

		const handleClickOutside = (event: MouseEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) {
				setIsMenuOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isMenuOpen])

	const emitUpload = (files: File[]) => {
		if (files.length === 0) return
		const items = mapFilesToUploadItems(files)
		onUpload?.(items)
		console.log(items)
	}

	const handleInputChange = (files: FileList | null) => {
		if (!files || files.length === 0) return
		emitUpload(Array.from(files))
	}

	const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()
		setIsDragging(false)

		const items = Array.from(event.dataTransfer.items)
		if (items.length === 0) {
			handleInputChange(event.dataTransfer.files)
			return
		}

		const filesFromEntries: File[] = []
		for (const item of items) {
			const entry = item.webkitGetAsEntry()
			if (entry) {
				const files = await readEntryRecursively(entry)
				filesFromEntries.push(...files)
				continue
			}

			const file = item.getAsFile()
			if (file) filesFromEntries.push(file)
		}

		emitUpload(filesFromEntries)
	}

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()
		setIsDragging(true)
	}

	const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()
		setIsDragging(false)
	}

	return (
		<div
			ref={containerRef}
			onDrop={handleDrop}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			className="relative inline-flex flex-col gap-2"
		>
			<button
				type="button"
				onClick={() => setIsMenuOpen((prev) => !prev)}
				className="rounded-md border px-3 py-2 text-sm"
			>
				Upload Files or Folder
			</button>

			{isMenuOpen && (
				<div className="absolute top-12 z-10 min-w-40 rounded-md border bg-background p-1 shadow-sm">
					<button
						type="button"
						onClick={() => {
							setIsMenuOpen(false)
							fileInputRef.current?.click()
						}}
						className="w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
					>
						Upload Files
					</button>
					<button
						type="button"
						onClick={() => {
							setIsMenuOpen(false)
							folderInputRef.current?.click()
						}}
						className="w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
					>
						Upload Folder
					</button>
				</div>
			)}

			<input
				type="file"
				multiple
				ref={fileInputRef}
				style={{ display: 'none' }}
				onChange={(event) => handleInputChange(event.target.files)}
			/>
			<input
				type="file"
				multiple
				ref={folderInputRef}
				style={{ display: 'none' }}
				onChange={(event) => handleInputChange(event.target.files)}
			/>

			{isDragging && (
				<div className="pointer-events-none absolute inset-0 rounded-md border-2 border-dashed border-primary bg-primary/5" />
			)}
		</div>
	)
}
