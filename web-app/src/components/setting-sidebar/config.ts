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
			label: 'Relay',
			icon: 'Network',
			to: 'network',
			translationNs: 'settings.navItems.relay',
		},
		{
			label: 'Language & Display',
			icon: 'Palette',
			to: 'appearance',
			translationNs: 'settings.navItems.appearance',
		},
	],
}
