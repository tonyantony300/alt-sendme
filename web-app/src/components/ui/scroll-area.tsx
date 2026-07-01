'use client'

import * as React from 'react'
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area'

import { cn } from '@/lib/utils'

type ScrollAreaProps = React.ComponentPropsWithoutRef<
	typeof ScrollAreaPrimitive.Root
> & {
	scrollFade?: boolean
	scrollbarGutter?: boolean
}

const ScrollArea = React.forwardRef<
	React.ElementRef<typeof ScrollAreaPrimitive.Root>,
	ScrollAreaProps
>(
	(
		{
			className,
			children,
			scrollFade = false,
			scrollbarGutter = false,
			...props
		},
		ref
	) => {
		return (
			<ScrollAreaPrimitive.Root
				ref={ref}
				className={cn('size-full min-h-0', className)}
				{...props}
			>
				<ScrollAreaPrimitive.Viewport
					className={cn(
						'h-full rounded-[inherit] outline-none transition-shadows focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background data-has-overflow-x:overscroll-x-contain',
						scrollFade &&
							'mask-t-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-start)))] mask-b-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-y-end)))] mask-l-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-start)))] mask-r-from-[calc(100%-min(var(--fade-size),var(--scroll-area-overflow-x-end)))] [--fade-size:1.5rem]',
						scrollbarGutter &&
							'data-has-overflow-y:pe-2.5 data-has-overflow-x:pb-2.5'
					)}
					data-slot="scroll-area-viewport"
				>
					{children}
				</ScrollAreaPrimitive.Viewport>
				<ScrollBar orientation="vertical" />
				<ScrollBar orientation="horizontal" />
				<ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
			</ScrollAreaPrimitive.Root>
		)
	}
)
ScrollArea.displayName = 'ScrollArea'

const ScrollBar = React.forwardRef<
	React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
	React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => {
	return (
		<ScrollAreaPrimitive.Scrollbar
			ref={ref}
			className={cn(
				'm-1 flex opacity-0 transition-opacity delay-300 data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5 data-[orientation=horizontal]:flex-col data-hovering:opacity-100 data-scrolling:opacity-100 data-hovering:delay-0 data-scrolling:delay-0 data-hovering:duration-100 data-scrolling:duration-100',
				className
			)}
			data-slot="scroll-area-scrollbar"
			orientation={orientation}
			{...props}
		>
			<ScrollAreaPrimitive.Thumb
				className="relative flex-1 rounded-full bg-foreground/20"
				data-slot="scroll-area-thumb"
			/>
		</ScrollAreaPrimitive.Scrollbar>
	)
})
ScrollBar.displayName = 'ScrollBar'

export { ScrollArea, ScrollBar }
