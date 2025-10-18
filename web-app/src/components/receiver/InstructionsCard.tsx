import type { InstructionsCardProps } from '../../types/sender'

export function InstructionsCard({}: InstructionsCardProps) {
  return (
    <div className="p-4 rounded-lg border" style={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.05)', 
      borderColor: 'rgba(255, 255, 255, 0.1)' 
    }}>
      <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--app-main-view-fg)' }}>
        How to receive files:
      </h3>
      <ol className="text-xs space-y-1 list-decimal list-inside" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
        <li>Get a ticket from someone who is sharing a file</li>
        <li>Paste the ticket in the text area above</li>
        <li>Click "Receive File" to start downloading</li>
        <li>Files will be saved to your Downloads folder</li>
      </ol>
    </div>
  )
}
