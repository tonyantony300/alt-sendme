import type { Input as InputPrimitive } from '@base-ui/react/input'
import { Input, type InputProps } from '@/components/ui/input'

type PreviousPublicInputProps = Omit<
	InputPrimitive.Props,
	'className' | 'size'
> & {
	className?: InputPrimitive.Props['className']
	size?: 'sm' | 'default' | 'lg' | number
	unstyled?: boolean
	nativeInput?: boolean
}

type Assert<T extends true> = T

type InputPropsRejectPreviousUnsafePublicShape = Assert<
	PreviousPublicInputProps extends InputProps ? false : true
>

export const inputPropsSafetyBoundaryCheck: InputPropsRejectPreviousUnsafePublicShape =
	true

export function InputAcceptsRuntimeNativeBoolean({
	isNative,
}: {
	isNative: boolean
}) {
	return <Input nativeInput={isNative} placeholder="Runtime mode" />
}

const runtimeNativeInput = true as boolean

export const inputPropsAcceptRuntimeNativeBoolean: InputProps = {
	nativeInput: runtimeNativeInput,
	className: 'runtime mode',
	placeholder: 'Runtime mode',
}

export const inputPropsRejectBaseUiClassNameCallback: InputProps = {
	// @ts-expect-error Input className is applied to the wrapper span, not the Base UI input.
	className: () => 'base-ui state class',
	placeholder: 'Base UI mode',
}

export const inputPropsRejectRuntimeNativeBooleanWithCallbackClassName: InputProps =
	{
		nativeInput: runtimeNativeInput,
		// @ts-expect-error Runtime boolean may render native input, so Base UI callback className is unsafe.
		className: () => 'base-ui state class',
		placeholder: 'Runtime mode',
	}

// @ts-expect-error Runtime boolean may render native input, so Base UI-only props are unsafe.
export const inputPropsRejectRuntimeNativeBooleanWithBaseUiProps: InputProps = {
	nativeInput: runtimeNativeInput,
	onValueChange: () => {},
}

export const inputPropsRejectNativeTrueWithBaseUiProps = (
	// @ts-expect-error Explicit native input mode must not accept Base UI-only props.
	<Input nativeInput onValueChange={() => {}} />
)
