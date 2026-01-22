import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

const defaultFileVariants = cva(
	'bg-background ring-border-background shadow-black/6.5 space-y-2 rounded-md shadow-md ring-1 [--color-border:color-mix(in_oklab,var(--color-foreground)15%,transparent)]',
	{
		variants: {
			size: {
				sm: 'w-12 p-2 space-y-1.5',
				md: 'w-16 p-2 space-y-2',
				lg: 'w-24 p-3 space-y-3',
			},
		},
		defaultVariants: {
			size: 'md',
		},
	}
)

interface DefaultFileIconProps
	extends VariantProps<typeof defaultFileVariants> {
	className?: string
}

export default function DefaultFileIcon({
	size,
	className,
}: DefaultFileIconProps) {
	return (
		<div
			aria-hidden="true"
			className={cn(defaultFileVariants({ size }), 'relative', className)}
		>
			<div className="flex items-center gap-1">
				<div className="bg-border size-2.5 rounded-full" />
				<div className="bg-border h-[3px] w-4 rounded-full" />
			</div>
			<div className="space-y-1.5">
				<div className="flex items-center gap-1">
					<div className="bg-border h-[3px] w-2.5 rounded-full" />
					<div className="bg-border h-[3px] w-6 rounded-full" />
				</div>
				<div className="flex items-center gap-1">
					<div className="bg-border h-[3px] w-2.5 rounded-full" />
					<div className="bg-border h-[3px] w-6 rounded-full" />
				</div>
			</div>
			<div className="space-y-1.5">
				<div className="bg-border h-[3px] w-full rounded-full" />
				<div className="flex items-center gap-1">
					<div className="bg-border h-[3px] w-2/3 rounded-full" />
					<div className="bg-border h-[3px] w-1/3 rounded-full" />
				</div>
			</div>
			{/** biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="lucide lucide-signature ml-auto size-3"
			>
				<path d="m21 17-2.156-1.868A.5.5 0 0 0 18 15.5v.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1c0-2.545-3.991-3.97-8.5-4a1 1 0 0 0 0 5c4.153 0 4.745-11.295 5.708-13.5a2.5 2.5 0 1 1 3.31 3.284" />
				<path d="M3 21h18" />
			</svg>
		</div>
	)
}
