import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const txtVariants = cva(
	'bg-background corner-tr-bevel ring-border z-1 shadow-black/6.5 relative rounded-md rounded-tr-[15%] shadow-md ring-1',
	{
		variants: {
			size: {
				sm: 'w-12 p-2 space-y-2',
				md: 'w-18 px-3 pb-3 space-y-2.5',
				lg: 'w-28 px-4 pb-4 space-y-3',
			},
		},
		defaultVariants: {
			size: 'md',
		},
	}
)

interface TxtIconProps extends VariantProps<typeof txtVariants> {
	className?: string
}

export default function TxtIcon({ size, className }: TxtIconProps) {
	return (
		<div aria-hidden="true" className={cn('relative size-fit', className)}>
			{/* TXT Badge */}
			<div className="z-2 after:border-foreground/15 text-shadow-sm text-shadow-white absolute -right-3 bottom-2 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-black shadow-lg shadow-amber-800/25 after:absolute after:inset-0 after:rounded after:border">
				TXT
			</div>

			{/* Text Icon Body */}
			<div className={cn(txtVariants({ size }))}>
				<div className="space-y-[5px]">
					<div className="decoration-foreground/50 text-xs text-transparent underline decoration-wavy decoration-2">
						Theqe
					</div>
					<div className="decoration-foreground/50 h-1 text-xs text-transparent underline decoration-wavy">
						Irung
					</div>
					<div className="bg-foreground/15 h-[0.5px] w-10 -rotate-[0.5deg] rounded-full" />
					<div className="bg-foreground/15 h-[0.5px] w-8 translate-x-px rotate-[0.3deg] rounded-full" />
					<div className="decoration-foreground/50 h-1 text-xs text-transparent underline decoration-wavy">
						Theqe
					</div>
					<div className="bg-foreground/15 h-[0.5px] w-10 -rotate-[0.3deg] rounded-full" />
					<div className="bg-foreground/15 h-[0.5px] w-6 translate-x-px rotate-[0.2deg] rounded-full" />
					<div className="bg-foreground/15 h-[0.5px] w-9 -rotate-[0.4deg] rounded-full" />
					<div className="bg-foreground/15 h-[0.5px] w-full translate-x-0.5 rotate-[0.5deg] rounded-full" />
					<div className="bg-foreground/15 h-[0.5px] w-9 -rotate-[0.4deg] rounded-full" />
					<div className="bg-foreground/15 h-[0.5px] w-8 translate-x-0.5 rotate-[0.5deg] rounded-full" />
				</div>
				<div className="bg-foreground/30 h-[0.5px] w-5 -rotate-[0.3deg] rounded-full" />
			</div>
		</div>
	)
}
