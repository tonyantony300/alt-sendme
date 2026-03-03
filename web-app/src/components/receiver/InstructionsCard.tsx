import type { InstructionsCardProps } from '../../types/ui'

export function InstructionsCard(_props: InstructionsCardProps) {
	return (
		<div className="p-4 rounded-lg border">
			<h3 className="text-sm font-medium mb-2">How to receive files:</h3>
			<ol className="text-xs space-y-1 list-decimal list-inside">
				<li>Get a ticket from someone who is sharing a file</li>
				<li>Paste the ticket in the text area above</li>
				<li>Click "Receive File" to start downloading</li>
				<li>Files will be saved to your Downloads folder</li>
			</ol>
		</div>
	)
}
