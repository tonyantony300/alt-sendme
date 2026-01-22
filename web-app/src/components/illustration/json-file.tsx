import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const jsonVariants = cva(
	'bg-background corner-tr-bevel ring-border-background z-1 shadow-black/6.5 relative rounded-md rounded-tr-[15%] shadow-md ring-1',
	{
		variants: {
			size: {
				sm: 'w-12 p-2 space-y-1.5',
				md: 'w-16 p-2.5 space-y-1.5',
				lg: 'w-24 p-4 space-y-2',
			},
		},
		defaultVariants: {
			size: 'md',
		},
	}
)

interface JsonIconProps extends VariantProps<typeof jsonVariants> {
	className?: string
}

export default function JsonIcon({ size, className }: JsonIconProps) {
	return (
		<div aria-hidden="true" className={cn('relative size-fit', className)}>
			{/* JSON Badge */}
			<div className="z-2 after:border-foreground/15 text-shadow-sm text-shadow-white/50 absolute -right-3 bottom-2 rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-semibold text-black shadow-lg shadow-yellow-900/25 after:absolute after:inset-0 after:rounded after:border">
				JSON
			</div>

			{/* JSON Icon Body */}
			<div className={cn(jsonVariants({ size }))}>
				<div className="space-y-1">
					<div className="flex items-center gap-1">
						<div className="text-foreground/40 font-mono text-[6px]">{'{'}</div>
					</div>
					<div className="flex items-center gap-1 pl-1.5">
						<div className="h-[3px] w-3 rounded-full bg-sky-400/60" />
						<div className="text-foreground/30 text-[5px]">:</div>
						<div className="h-[3px] w-4 rounded-full bg-emerald-400/60" />
					</div>
					<div className="flex items-center gap-1 pl-1.5">
						<div className="h-[3px] w-4 rounded-full bg-sky-400/60" />
						<div className="text-foreground/30 text-[5px]">:</div>
						<div className="h-[3px] w-2 rounded-full bg-amber-400/60" />
					</div>
					<div className="flex items-center gap-1 pl-1.5">
						<div className="h-[3px] w-2.5 rounded-full bg-sky-400/60" />
						<div className="text-foreground/30 text-[5px]">:</div>
						<div className="h-[3px] w-5 rounded-full bg-violet-400/60" />
					</div>
					<div className="flex items-center gap-1 pl-1.5">
						<div className="h-[3px] w-3.5 rounded-full bg-sky-400/60" />
						<div className="text-foreground/30 text-[5px]">:</div>
						<div className="h-[3px] w-3 rounded-full bg-rose-400/60" />
					</div>
					<div className="flex items-center gap-1">
						<div className="text-foreground/40 font-mono text-[6px]">{'}'}</div>
					</div>
				</div>
			</div>
		</div>
	)
}
