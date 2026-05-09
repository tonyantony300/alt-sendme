import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const videoVariants = cva(
	'bg-background corner-tr-bevel ring-border z-1 shadow-black/6.5 relative rounded-md rounded-tr-[15%] shadow-md ring-1',
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

interface VideoIconProps extends VariantProps<typeof videoVariants> {
	className?: string
}

export default function VideoIcon({ size, className }: VideoIconProps) {
	return (
		<div aria-hidden="true" className={cn('relative size-fit', className)}>
			<div className="z-2 after:border-foreground/15 text-shadow-sm absolute -right-3 bottom-2 rounded bg-violet-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-violet-900/25 after:absolute after:inset-0 after:rounded after:border">
				VID
			</div>
			<div className={cn(videoVariants({ size }))}>
				<div className="relative h-16">
					{/* Screen background */}
					<div className="absolute inset-0 rounded-sm bg-violet-950/20"></div>
					{/* Film sprocket dots — left column */}
					<div className="absolute left-0.5 top-0 flex h-full flex-col justify-around py-1">
						<div className="size-1 rounded-sm bg-violet-400/50"></div>
						<div className="size-1 rounded-sm bg-violet-400/50"></div>
						<div className="size-1 rounded-sm bg-violet-400/50"></div>
					</div>
					{/* Film sprocket dots — right column */}
					<div className="absolute right-0.5 top-0 flex h-full flex-col justify-around py-1">
						<div className="size-1 rounded-sm bg-violet-400/50"></div>
						<div className="size-1 rounded-sm bg-violet-400/50"></div>
						<div className="size-1 rounded-sm bg-violet-400/50"></div>
					</div>
					{/* Play button triangle */}
					<div className="absolute inset-0 flex items-center justify-center">
						<div
							className="border-y-transparent border-l-violet-400/80"
							style={{
								width: 0,
								height: 0,
								borderTopWidth: 5,
								borderBottomWidth: 5,
								borderLeftWidth: 8,
								borderStyle: 'solid',
								borderTopColor: 'transparent',
								borderBottomColor: 'transparent',
							}}
						></div>
					</div>
					{/* Progress bar */}
					<div className="absolute bottom-1.5 left-2 right-2 h-0.5 rounded-full bg-violet-300/20">
						<div className="h-full w-2/5 rounded-full bg-violet-400/60"></div>
					</div>
				</div>
			</div>
		</div>
	)
}
