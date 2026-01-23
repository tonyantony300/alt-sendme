import { cn } from '@/lib/utils'

interface StatusIndicatorProps {
	isCompleted: boolean
	isTransporting: boolean
	statusText: string
}

export function StatusIndicator({
	isCompleted,
	isTransporting,
	statusText,
}: StatusIndicatorProps) {
	return (
		<div className="flex items-center mb-2">
			<div
				className={cn(
					'relative size-2 rounded-full bg-gray-500 before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-gray-400 before:opacity-75 mr-2',
					{
						'bg-emerald-500 before:bg-emerald-400': isCompleted,
						'bg-blue-500 before:bg-blue-400': isTransporting,
					}
				)}
			></div>
			<p
				className={cn('text-sm font-medium text-gray-600', {
					'text-emerald-600': isCompleted,
					'text-blue-600': isTransporting,
				})}
			>
				{statusText}
			</p>
		</div>
	)
}
