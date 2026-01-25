import { cn } from '@/lib/utils'

interface StatusIndicatorProps {
	isCompleted: boolean
	isTransporting: boolean
	statusText: string
	activeConnectionCount?: number
	isBroadcastMode?: boolean
}

export function StatusIndicator({
	isCompleted,
	isTransporting,
	statusText,
	activeConnectionCount = 0,
	isBroadcastMode = false,
}: StatusIndicatorProps) {
	// In broadcast mode, show green when there are active connections
	// Use activeConnectionCount if available, otherwise show connection info if count > 0
	const hasActiveConnections = isBroadcastMode && activeConnectionCount > 0
	const displayStatusText = isBroadcastMode && activeConnectionCount > 0
		? `(${activeConnectionCount} ${activeConnectionCount === 1 ? 'transfer' : 'transfers'} in progress)`
		: statusText

	return (
		<div className="flex items-center mb-2">
			<div
				className={cn(
					'relative size-2 rounded-full bg-gray-500 before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-gray-400 before:opacity-75 mr-2',
					{
						'bg-emerald-500 before:bg-emerald-400': isCompleted || hasActiveConnections || isTransporting,
					}
				)}
			></div>
			<p
				className={cn('text-sm font-medium text-gray-600', {
					'text-emerald-600': isCompleted || hasActiveConnections || isTransporting,
				})}
			>
				{displayStatusText}
			</p>
		</div>
	)
}
