import {  Share2 } from 'lucide-react'
import type { ShareActionProps } from '../../types/sender'

export function ShareActionCard({ 
  selectedPath, 
  isLoading, 
  onStartSharing 
}: ShareActionProps & { onStartSharing: () => Promise<void> }) {
  if (!selectedPath) return null

  return (
    <div className="" 
    >
 
      <button
        onClick={onStartSharing}
        disabled={isLoading}
        className="w-full py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        style={{
          backgroundColor: 'var(--app-primary)',
          color: 'var(--app-primary-fg)',
        }}
      >
        <Share2 className="h-4 w-4 mr-2" />
        {isLoading ? 'Starting Share...' : 'Start Sharing'}
      </button>
    </div>
  )
}
