import type { INavItem } from '../../types/nav-item'

export const settingSidebarConfig: Record<string, INavItem[]> = {
	core: [
		{
			label: 'General',
			icon: 'GearSix',
			to: '',
			translationNs: 'settings.navItems.general',
		},
		{
			label: 'Devices',
			icon: 'Devices',
			to: 'devices',
			translationNs: 'settings.navItems.devices',
		},
		{
			label: 'Infra',
			icon: 'Network',
			to: 'network',
			translationNs: 'settings.navItems.infra',
		},
		{
			label: 'Language & Display',
			icon: 'Palette',
			to: 'appearance',
			translationNs: 'settings.navItems.appearance',
		},
	],
}
