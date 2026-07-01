import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const folderVariants = cva(
	'bg-background ring-border shadow-black/6.5 relative flex items-center justify-center rounded-md shadow-md ring-1 corner-tr-bevel rounded-tr-[15%]',
	{
		variants: {
			size: {
				sm: 'h-10 w-12',
				md: 'h-12 w-16',
				lg: 'h-20 w-24',
			},
		},
		defaultVariants: {
			size: 'md',
		},
	}
)

interface FolderIconProps extends VariantProps<typeof folderVariants> {
	className?: string
}

export default function FolderIcon({ size, className }: FolderIconProps) {
	return (
		<div
			aria-hidden="true"
			className={cn('relative flex items-center justify-center', className)}
		>
			{/* Tab (Back layer) */}
			<div
				className={cn(
					'bg-card ring-border absolute left-0 z-0 rounded-t-sm ring-1',
					// Tab position and size
					size === 'sm'
						? '-top-1.5 left-[1px] h-4 w-5'
						: size === 'lg'
							? '-top-2.5 left-[1px] h-8 w-10'
							: '-top-2 left-[1px] h-5 w-7' // md
				)}
			/>

			{/* Main Body (Front layer) */}
			<div className={cn(folderVariants({ size }), 'z-10 ')}>
				<div className="space-y-1">
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
				</div>
			</div>
		</div>
	)
}
