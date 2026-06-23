import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

type BackArrowIconProps = SVGProps<SVGSVGElement> & {
	size?: number
}

export function BackArrowIcon({
	size = 16,
	className,
	...props
}: BackArrowIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			className={cn('shrink-0', className)}
			{...props}
		>
			<path
				d="M10.25 3.25L5.5 8L10.25 12.75"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}
