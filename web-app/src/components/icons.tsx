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
	TranslateIcon,
	SidebarIcon,
	XIcon,
} from '@phosphor-icons/react'

const ICONS = {
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
	Translate: TranslateIcon,
	Sidebar: SidebarIcon,
	X: XIcon,
} as const satisfies Record<string, React.ComponentType<IconProps>>

export type IconName = keyof typeof ICONS

export function LazyIcon(props: IconProps & { name: IconName }) {
	const Icon = ICONS[props.name]

	if (Icon) return <Icon weight="regular" size="14" {...props} />
	return null
}
