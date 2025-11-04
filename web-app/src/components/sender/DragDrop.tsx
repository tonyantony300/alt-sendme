import { useEffect } from 'react'
import { Dropzone } from './Dropzone'
import { BrowseButtons } from './BrowseButtons'
import { AppAlertDialog } from '../AppAlertDialog'
import { useDragDrop } from '../../hooks/useDragDrop'

interface DragDropProps {
  onFileSelect: (path: string) => void
  selectedPath?: string | null
  isLoading?: boolean
}

export function DragDrop({ onFileSelect, selectedPath, isLoading }: DragDropProps) {
  const {
    isDragActive,
    pathType,
    showFullPath,
    alertDialog,
    toggleFullPath,
    browseFile,
    browseFolder,
    closeAlert,
    checkPathType
  } = useDragDrop(onFileSelect)

  useEffect(() => {
    if (selectedPath) {
      checkPathType(selectedPath)
    }
  }, [selectedPath, checkPathType])

  return (
    <div className='h-full flex flex-col justify-between'>
      <Dropzone
        isDragActive={isDragActive}
        selectedPath={selectedPath || null}
        pathType={pathType}
        showFullPath={showFullPath}
        isLoading={isLoading || false}
        onToggleFullPath={toggleFullPath}
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
