import { Copy, X, CheckCircle } from 'lucide-react'
import type { SharingControlsProps, TicketDisplayProps } from '../../types/sender'

export function SharingActiveCard({ 
  selectedPath, 
  ticket, 
  copySuccess, 
  onCopyTicket, 
  onStopSharing 
}: SharingControlsProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg border" style={{ 
        backgroundColor: 'rgba(45, 120, 220, 0.1)', 
        borderColor: 'var(--app-accent)' 
      }}>
        <div className="flex items-center mb-2">
          <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: 'var(--app-accent)' }}></div>
          <p className="text-sm font-medium" style={{ color: 'var(--app-accent)' }}>
            Sharing Active
          </p>
        </div>
        <p className="text-xs mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          <strong>File:</strong> {selectedPath?.split('/').pop()}
        </p>
        <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Keep this app open while others download your files
        </p>
      </div>
      
      {ticket && (
        <TicketDisplay 
          ticket={ticket} 
          copySuccess={copySuccess} 
          onCopyTicket={onCopyTicket} 
        />
      )}
      
      <button
        onClick={onStopSharing}
        className="w-full py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center"
        style={{
          backgroundColor: 'var(--app-destructive)',
          color: 'var(--app-destructive-fg)',
        }}
      >
        <X className="h-4 w-4 mr-2" />
        Stop Sharing
      </button>
    </div>
  )
}

export function TicketDisplay({ ticket, copySuccess, onCopyTicket }: TicketDisplayProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium" style={{ color: 'var(--app-main-view-fg)' }}>
        Share this ticket:
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={ticket}
          readOnly
          className="flex-1 p-3 rounded-md text-xs font-mono"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'var(--app-main-view-fg)',
          }}
        />
        <button
          onClick={onCopyTicket}
          className="px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            backgroundColor: copySuccess ? 'var(--app-primary)' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: copySuccess ? 'var(--app-primary-fg)' : 'var(--app-main-view-fg)',
          }}
          title="Copy to clipboard"
        >
          {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
        Send this ticket to the person who wants to receive your file
      </p>
    </div>
  )
}
