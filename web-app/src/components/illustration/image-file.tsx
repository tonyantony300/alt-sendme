import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const imageVariants = cva(
	'bg-background corner-tr-bevel ring-border z-1 shadow-black/6.5 relative rounded-md rounded-tr-[15%] shadow-md ring-1',
	{
		variants: {
			size: {
				sm: 'w-12 p-2 space-y-1.5',
				md: 'w-16 p-2 space-y-1.5',
				lg: 'w-24 p-2 space-y-2',
			},
		},
		defaultVariants: {
			size: 'md',
		},
	}
)

interface ImageIconProps extends VariantProps<typeof imageVariants> {
	className?: string
}

export default function ImageIcon({ size, className }: ImageIconProps) {
	return (
		<div aria-hidden="true" className={cn('relative size-fit', className)}>
			<div className="z-2 after:border-foreground/15 text-shadow-sm absolute -right-3 bottom-2 rounded bg-pink-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-pink-900/25 after:absolute after:inset-0 after:rounded after:border">
				IMG
			</div>
			<div className={cn(imageVariants({ size }))}>
				<div className="relative h-16">
					<div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-emerald-500/30 to-transparent"></div>
					<div className="absolute bottom-1 left-1 h-3 w-5 rounded-t-full bg-emerald-500/40"></div>
					<div className="absolute bottom-1 right-2 h-5 w-4 rounded-t-full bg-emerald-600/40"></div>
					<div className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-400/60"></div>
				</div>
			</div>
		</div>
	)
}
