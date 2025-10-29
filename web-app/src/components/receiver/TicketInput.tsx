import { Download } from 'lucide-react'
import type { TicketInputProps } from '../../types/sender'

export function TicketInput({ 
  ticket, 
  isReceiving, 
  savePath,
  onTicketChange, 
  onBrowseFolder,
  onReceive 
}: TicketInputProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
          Save to folder:
        </label>
        <div className="flex gap-2">
          <div
            className="p-3 rounded-md text-sm font-mono flex items-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--app-main-view-fg)',
              width: '85%',
            }}
          >
            {savePath || 'No folder selected'}
          </div>
          <button
            onClick={onBrowseFolder}
            disabled={isReceiving}
            className="w-[15%] py-3 px-4 rounded-md font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            style={{
              backgroundColor: 'var(--app-accent)',
              color: 'var(--app-accent-fg)',
            }}
          >
            Browse
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
          Paste the ticket here:
        </label>
        <div className="flex gap-2 p-0.5">
          <textarea
            value={ticket}
            onChange={(e) => onTicketChange(e.target.value)}
            placeholder="sendme receive ticket..."
            className="custom-scrollbar p-3 rounded-md text-sm font-mono resize-none focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'var(--app-main-view-fg)',
              width: '85%',
              lineHeight: '1.4',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              overflowX: 'hidden',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
            rows={6}
          />
          <button
            onClick={onReceive}
            disabled={!ticket.trim() || isReceiving}
            className="w-[15%] py-3 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-80 flex items-center justify-center"
            style={{
              backgroundColor: (!ticket.trim() || isReceiving) ? 'var(--app-accent)' : 'var(--app-primary)',
              color: 'var(--app-accent-fg)',
            }}
          >
            <Download className="h-8 w-8" />
          </button>
        </div>
      </div>
    </div>
  )
}
