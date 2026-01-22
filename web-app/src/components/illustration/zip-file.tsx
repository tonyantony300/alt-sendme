import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const zipVariants = cva(
	'bg-background corner-tr-bevel ring-border-background z-1 shadow-black/6.5 relative rounded-md rounded-tr-[15%] shadow-md ring-1',
	{
		variants: {
			size: {
				sm: 'w-12 p-2',
				md: 'w-16 p-2.5',
				lg: 'w-24 p-4',
			},
		},
		defaultVariants: {
			size: 'md',
		},
	}
)

interface ZipIconProps extends VariantProps<typeof zipVariants> {
	className?: string
}

export default function ZipIcon({ size, className }: ZipIconProps) {
	return (
		<div aria-hidden="true" className={cn('relative size-fit', className)}>
			{/* ZIP Badge */}
			<div className="z-2 after:border-foreground/15 text-shadow-sm absolute -right-3 bottom-2 rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-amber-900/25 after:absolute after:inset-0 after:rounded after:border">
				ZIP
			</div>

			{/* Archive Icon Body */}
			<div className={cn(zipVariants({ size }))}>
				<div className="flex h-16 items-center justify-center">
					<div className="relative flex flex-col items-center">
						<div className="space-y-0.5">
							<div className="flex overflow-hidden rounded-full">
								<div className="bg-foreground/30 h-1.5 w-1.5" />
								<div className="bg-foreground/5 h-1.5 w-1.5" />
							</div>
							<div className="flex overflow-hidden rounded-full">
								<div className="bg-foreground/5 h-1.5 w-1.5" />
								<div className="bg-foreground/30 h-1.5 w-1.5" />
							</div>
							<div className="flex overflow-hidden rounded-full">
								<div className="bg-foreground/30 h-1.5 w-1.5" />
								<div className="bg-foreground/5 h-1.5 w-1.5" />
							</div>
							<div className="flex overflow-hidden rounded-full">
								<div className="bg-foreground/5 h-1.5 w-1.5" />
								<div className="bg-foreground/30 h-1.5 w-1.5" />
							</div>
							<div className="flex overflow-hidden rounded-full">
								<div className="bg-foreground/30 h-1.5 w-1.5" />
								<div className="bg-foreground/5 h-1.5 w-1.5" />
							</div>
							<div className="flex overflow-hidden rounded-full">
								<div className="bg-foreground/5 h-1.5 w-1.5" />
								<div className="bg-foreground/30 h-1.5 w-1.5" />
							</div>
						</div>
						<div className="bg-foreground/15 mt-0.5 h-2.5 w-4 rounded-sm border border-amber-500/40" />
					</div>
				</div>
			</div>
		</div>
	)
}
