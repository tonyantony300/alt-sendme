import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const imageVariants = cva('relative', {
	variants: {
		size: {
			sm: 'h-12',
			md: 'h-16',
			lg: 'h-24',
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

interface ImageIconProps extends VariantProps<typeof imageVariants> {
	className?: string
}

export default function ImageIcon({ size, className }: ImageIconProps) {
	return (
		<div className={cn(imageVariants({ size }), className)}>
			<div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-emerald-500/30 to-transparent" />
			<div className="absolute bottom-1 left-1 h-3 w-5 rounded-t-full bg-emerald-500/40" />
			<div className="absolute bottom-1 right-2 h-5 w-4 rounded-t-full bg-emerald-600/40" />
			<div className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-400/60" />
		</div>
	)
}
