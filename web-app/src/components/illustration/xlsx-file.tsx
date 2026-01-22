import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const xlsxVariants = cva(
	'bg-background corner-tr-bevel ring-border-background z-1 shadow-black/6.5 relative rounded-md rounded-tr-[15%] shadow-md ring-1',
	{
		variants: {
			size: {
				sm: 'w-12 p-2 space-y-2',
				md: 'w-16 p-2 space-y-2',
				lg: 'w-24 p-3 space-y-3',
			},
		},
		defaultVariants: {
			size: 'md',
		},
	}
)

interface XlsxIconProps extends VariantProps<typeof xlsxVariants> {
	className?: string
}

export default function XlsxIcon({ size, className }: XlsxIconProps) {
	return (
		<div aria-hidden="true" className={cn('relative size-fit', className)}>
			{/* XLS Badge */}
			<div className="z-2 after:border-foreground/15 text-shadow-sm absolute -right-3 bottom-2 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-emerald-900/25 after:absolute after:inset-0 after:rounded after:border">
				XLS
			</div>

			{/* Spreadsheet Icon Body */}
			<div className={cn(xlsxVariants({ size }))}>
				<div className="border-foreground/10 corner-tr-bevel grid grid-cols-3 gap-px overflow-hidden rounded-tr">
					<div className="bg-foreground/5 col-span-3 grid grid-cols-3 gap-px">
						<div className="bg-foreground/10 h-2" />
						<div className="bg-foreground/10 h-2" />
						<div className="bg-foreground/10 h-2" />
					</div>
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
					<div className="bg-foreground/5 h-2" />
				</div>
			</div>
		</div>
	)
}
