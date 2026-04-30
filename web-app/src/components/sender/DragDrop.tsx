import { useEffect } from 'react'
import { Dropzone } from './Dropzone'
import { BrowseButtons } from './BrowseButtons'
import { AppAlertDialog } from '../AppAlertDialog'
import { useDragDrop } from '../../hooks/useDragDrop'

interface DragDropProps {
	onFileSelect: (path: string, pathType?: 'file' | 'directory') => Promise<void>
	onFilesSelect: (
		paths: string[],
		pathType?: 'file' | 'directory'
	) => Promise<void>
	onRemoveSelectedPath: (path: string) => void
	selectedPaths: string[]
	selectedPath?: string | null
	isLoading?: boolean
	onClearSelection: () => void
}

export function DragDrop({
	onFileSelect,
	onFilesSelect,
	onRemoveSelectedPath,
	selectedPaths,
	selectedPath,
	isLoading,
	onClearSelection,
}: DragDropProps) {
	const {
		isDragActive,
		pathType,
		showFullPath,
		alertDialog,
		toggleFullPath,
		browseFile,
		addMoreFiles,
		addMoreFolders,
		browseFolder,
		closeAlert,
		checkPathType,
	} = useDragDrop(onFileSelect, onFilesSelect)

	useEffect(() => {
		if (selectedPath) {
			checkPathType(selectedPath)
		}
	}, [selectedPath, checkPathType])

	return (
		<div className="h-full flex flex-col justify-between">
			<Dropzone
				isDragActive={isDragActive}
				selectedPaths={selectedPaths}
				selectedPath={selectedPath || null}
				pathType={pathType}
				showFullPath={showFullPath}
				isLoading={isLoading || false}
				onToggleFullPath={toggleFullPath}
				onAddFiles={addMoreFiles}
				onAddFolders={addMoreFolders}
				onRemoveSelectedPath={onRemoveSelectedPath}
				onClearSelection={onClearSelection}
			/>

			{!selectedPath && (
				<BrowseButtons
					isLoading={isLoading || false}
					onBrowseFile={browseFile}
					onBrowseFolder={browseFolder}
				/>
			)}

			<AppAlertDialog
				isOpen={alertDialog.isOpen}
				title={alertDialog.title}
				description={alertDialog.description}
				type={alertDialog.type}
				onClose={closeAlert}
			/>
		</div>
	)
}
