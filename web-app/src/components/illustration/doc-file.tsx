import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const docVariants = cva(
	'bg-background corner-tr-bevel ring-border-background z-1 shadow-black/6.5 relative space-y-3 rounded-md rounded-tr-[15%] shadow-md ring-1',
	{
		variants: {
			size: {
				sm: 'w-12 p-2 space-y-2',
				md: 'w-16 p-3 space-y-3',
				lg: 'w-24 p-5 space-y-4',
			},
		},
		defaultVariants: {
			size: 'md',
		},
	}
)

interface DocIconProps extends VariantProps<typeof docVariants> {
	className?: string
}

export default function DocIcon({ size, className }: DocIconProps) {
	return (
		<div aria-hidden="true" className={cn('relative size-fit', className)}>
			{/* DOC Badge */}
			<div className="z-2 after:border-foreground/15 text-shadow-sm absolute -right-3 bottom-2 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-blue-900/25 after:absolute after:inset-0 after:rounded after:border">
				DOC
			</div>

			{/* Document Icon Body */}
			<div className={cn(docVariants({ size }))}>
				<div className="space-y-1.5">
					<div className="flex gap-2">
						<div className="bg-foreground/10 h-0.5 w-full rounded-full" />
					</div>
					<div className="flex gap-1">
						<div className="bg-foreground/10 h-0.5 w-1/3 rounded-full" />
						<div className="bg-foreground/10 h-0.5 w-1/3 rounded-full" />
						<div className="bg-foreground/10 h-0.5 w-1/3 rounded-full" />
					</div>
					<div className="flex gap-1">
						<div className="bg-foreground/10 h-0.5 w-1/2 rounded-full" />
						<div className="bg-foreground/10 h-0.5 w-1/2 rounded-full" />
					</div>
					<div className="flex gap-1">
						<div className="bg-foreground/10 h-0.5 w-1/3 rounded-full" />
						<div className="bg-foreground/10 h-0.5 w-1/3 rounded-full" />
						<div className="bg-foreground/10 h-0.5 w-1/3 rounded-full" />
					</div>
					<div className="flex gap-1">
						<div className="bg-foreground/10 h-0.5 w-1/3 rounded-full" />
						<div className="bg-foreground/10 h-0.5 w-2/3 rounded-full" />
						<div className="bg-foreground/10 h-0.5 w-1/3 rounded-full" />
					</div>
					<div className="flex gap-1">
						<div className="bg-foreground/10 h-0.5 w-1/3 rounded-full" />
						<div className="bg-foreground/10 h-0.5 w-1/3 rounded-full" />
					</div>
				</div>

				<div className="flex gap-1 pt-1">
					<div className="bg-foreground h-0.5 w-4 rounded-full" />
				</div>
			</div>
		</div>
	)
}
