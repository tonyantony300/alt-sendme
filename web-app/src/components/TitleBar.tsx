import { X, Minus } from 'lucide-react'
import { getCurrentWindow } from '@tauri-apps/api/window'

interface TitleBarProps {
  title?: string
}

export const TitleBar = ({ title = 'ALT-SENDME' }: TitleBarProps) => {
  const handleMinimize = async () => {
    const window = await getCurrentWindow()
    await window.minimize()
  }

  const handleClose = async () => {
    const window = await getCurrentWindow()
    await window.close()
  }

  return (
    <div className="custom-title-bar" data-tauri-drag-region>
      <div className="flex-1" data-tauri-drag-region>
        <span className="text-sm font-medium opacity-70" data-tauri-drag-region>
          {title}
        </span>
      </div>
      
      {/* Window controls - only show on Linux */}
      <div className="window-controls">
        <button
          onClick={handleMinimize}
          className="window-control-btn"
          aria-label="Minimize"
          title="Minimize"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleClose}
          className="window-control-btn close"
          aria-label="Close"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

