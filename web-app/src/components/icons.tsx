import type { IconProps } from '@phosphor-icons/react'
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	PaletteIcon,
	BellRingingIcon,
	NetworkIcon,
	HouseIcon,
	CheckCircleIcon,
	XCircleIcon,
	UserIcon,
	UsersIcon,
	MagnifyingGlassIcon,
	GearSixIcon,
	CaretDownIcon,
	CaretUpIcon,
	CaretLeftIcon,
	HexagonIcon,
	FunnelSimpleXIcon,
	InfoIcon,
	CaretRightIcon,
} from '@phosphor-icons/react'

export type IconName =
	| 'ArrowLeft'
	| 'ArrowRight'
	| 'Palette'
	| 'BellRinging'
	| 'Network'
	| 'House'
	| 'CheckCircle'
	| 'XCircle'
	| 'User'
	| 'Users'
	| 'MagnifyingGlass'
	| 'GearSix'
	| 'CaretDown'
	| 'CaretUp'
	| 'CaretLeft'
	| 'Hexagon'
	| 'FunnelSimpleX'
	| 'Info'
	| 'CaretRight'

const ICONS: Record<IconName, React.ComponentType<IconProps>> = {
	ArrowLeft: ArrowLeftIcon,
	ArrowRight: ArrowRightIcon,
	Palette: PaletteIcon,
	BellRinging: BellRingingIcon,
	Network: NetworkIcon,
	House: HouseIcon,
	CheckCircle: CheckCircleIcon,
	XCircle: XCircleIcon,
	User: UserIcon,
	Users: UsersIcon,
	MagnifyingGlass: MagnifyingGlassIcon,
	GearSix: GearSixIcon,
	CaretDown: CaretDownIcon,
	CaretUp: CaretUpIcon,
	CaretLeft: CaretLeftIcon,
	Hexagon: HexagonIcon,
	FunnelSimpleX: FunnelSimpleXIcon,
	Info: InfoIcon,
	CaretRight: CaretRightIcon,
}

export function LazyIcon(props: IconProps & { name: IconName }) {
	const Icon = ICONS[props.name]

	if (Icon) return <Icon weight="regular" size="14" {...props} />
	return null
}
