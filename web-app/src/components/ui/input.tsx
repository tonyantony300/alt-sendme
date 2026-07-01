'use client'

import { Input as InputPrimitive } from '@base-ui/react/input'
import type * as React from 'react'

import { cn } from '@/lib/utils'

type InputPrimitiveProps = Omit<InputPrimitive.Props, 'size' | 'className'>
type NativeInputProps = Omit<
	React.ComponentPropsWithoutRef<'input'>,
	'size' | 'className'
>

type SharedInputProps = {
	className?: React.ComponentPropsWithoutRef<'span'>['className']
	size?: 'sm' | 'default' | 'lg' | number
	unstyled?: boolean
}

type BaseUiInputProps = SharedInputProps &
	InputPrimitiveProps & {
		nativeInput?: false
	}

type BaseUiOnlyInputPropNames = Exclude<keyof InputPrimitiveProps, keyof NativeInputProps>
type NativeSafeInputProps = NativeInputProps & {
	[Key in BaseUiOnlyInputPropNames]?: never
}

type NativeInputModeProps = SharedInputProps &
	NativeSafeInputProps & {
		nativeInput?: boolean
	}

type InputProps = BaseUiInputProps | NativeInputModeProps

function Input(props: InputProps) {
	const { className, size = 'default', unstyled = false } = props
	const inputClassName = cn(
		'h-8.5 w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] leading-8.5 outline-none placeholder:text-muted-foreground/72 sm:h-7.5 sm:leading-7.5',
		size === 'sm' &&
			'h-7.5 px-[calc(--spacing(2.5)-1px)] leading-7.5 sm:h-6.5 sm:leading-6.5',
		size === 'lg' && 'h-9.5 leading-9.5 sm:h-8.5 sm:leading-8.5',
		props.type === 'search' &&
			'[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none',
		props.type === 'file' &&
			'text-muted-foreground file:me-3 file:bg-transparent file:font-medium file:text-foreground file:text-sm'
	)

	const renderControl = (control: React.ReactNode) => (
		<span
			className={
				cn(
					!unstyled &&
						'relative inline-flex w-full rounded-lg border border-input bg-background not-dark:bg-clip-padding text-base text-foreground shadow-xs/5 ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/6%)] has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16 has-aria-invalid:border-destructive/36 has-focus-visible:border-ring has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-[3px] sm:text-sm dark:bg-input/32 dark:has-aria-invalid:ring-destructive/24 dark:not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)]',
					className
				) || undefined
			}
			data-size={size}
			data-slot="input-control"
		>
			{control}
		</span>
	)

	if (props.nativeInput) {
		const {
			className: _className,
			size: _size,
			unstyled: _unstyled,
			nativeInput: _nativeInput,
			...nativeProps
		} = props

		return renderControl(
			<input
				className={inputClassName}
				data-slot="input"
				size={typeof size === 'number' ? size : undefined}
				{...nativeProps}
			/>
		)
	}

	const {
		className: _className,
		size: _size,
		unstyled: _unstyled,
		nativeInput: _nativeInput,
		...baseUiProps
	} = props

	return renderControl(
		<InputPrimitive
			className={inputClassName}
			data-slot="input"
			size={typeof size === 'number' ? size : undefined}
			{...(baseUiProps as InputPrimitiveProps)}
		/>
	)
}

export { Input, type InputProps }
