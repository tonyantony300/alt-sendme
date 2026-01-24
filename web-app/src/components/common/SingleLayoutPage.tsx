import { cn } from '@/lib/utils'

export function SingleLayoutPage({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'container mx-auto p-8 flex-1 overflow-auto flex flex-col',
				className
			)}
			{...props}
		/>
	)
}
