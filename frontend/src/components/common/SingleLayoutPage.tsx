import { cn } from '@/lib/utils'

export function SingleLayoutPage({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'container mx-auto py-8 flex-1 overflow-auto flex flex-col',
				// Phones have little horizontal room, so the gutter stays narrow below
				// `sm` and only widens for a notch/cutout via the safe-area insets.
				'pl-[calc(0.75rem+var(--safe-area-left))] pr-[calc(0.75rem+var(--safe-area-right))]',
				'sm:pl-[calc(2rem+var(--safe-area-left))] sm:pr-[calc(2rem+var(--safe-area-right))]',
				className
			)}
			{...props}
		/>
	)
}
