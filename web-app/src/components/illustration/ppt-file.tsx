import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const pptVariants = cva(
	'bg-background corner-tr-bevel ring-border-background z-1 shadow-black/6.5 relative rounded-md rounded-tr-[15%] shadow-md ring-1',
	{
		variants: {
			size: {
				sm: 'w-12 p-2 space-y-3',
				md: 'w-16 p-2.5 space-y-4',
				lg: 'w-24 p-4 space-y-6',
			},
		},
		defaultVariants: {
			size: 'md',
		},
	}
)

interface PptIconProps extends VariantProps<typeof pptVariants> {
	className?: string
}

export default function PptIcon({ size, className }: PptIconProps) {
	return (
		<div aria-hidden="true" className={cn('relative size-fit', className)}>
			{/* PPT Badge */}
			<div className="z-2 after:border-foreground/15 text-shadow-sm absolute -right-3 bottom-2 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-orange-900/25 after:absolute after:inset-0 after:rounded after:border">
				PPT
			</div>

			{/* Presentation Icon Body */}
			<div className={cn(pptVariants({ size }))}>
				<div className="bg-foreground/5 space-y-1.5 rounded border p-1.5">
					<div className="bg-foreground/15 mx-auto h-[3px] w-8 rounded-full" />
					<div className="flex justify-center gap-1">
						<div className="size-3 rounded-sm bg-orange-400/40" />
						<div className="size-3 rounded-full bg-sky-400/40" />
					</div>
					<div className="space-y-0.5">
						<div className="bg-foreground/10 mx-auto h-0.5 w-9 rounded-full" />
						<div className="bg-foreground/10 mx-auto h-0.5 w-6 rounded-full" />
					</div>
				</div>
				<div className="flex justify-center gap-1">
					<div className="bg-foreground/20 rounded-0.5 size-1.5" />
					<div className="bg-foreground/10 rounded-0.5 size-1.5" />
					<div className="bg-foreground/10 rounded-0.5 size-1.5" />
				</div>
			</div>
		</div>
	)
}
