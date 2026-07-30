export type AppTheme =
	| 'auto'
	| 'light'
	| 'dark'
	| 'midnight'
	| 'paper'
	| 'nord'
	| 'cupcake'
	| 'corporate'
	| 'winter'
	| 'caramellatte'
	| 'silk'
	| 'dim'
	| 'night'
	| 'sunset'
	| 'abyss'
	| 'coffee'
	| 'dracula'
	| 'business'
	| 'synthwave'

export const APP_THEMES: AppTheme[] = [
	'auto',
	'light',
	'dark',
	'midnight',
	'paper',
	'nord',
	'cupcake',
	'corporate',
	'winter',
	'caramellatte',
	'silk',
	'dim',
	'night',
	'sunset',
	'abyss',
	'coffee',
	'dracula',
	'business',
	'synthwave',
]

export const NAMED_THEMES = [
	'midnight',
	'paper',
	'nord',
	'cupcake',
	'corporate',
	'winter',
	'caramellatte',
	'silk',
	'dim',
	'night',
	'sunset',
	'abyss',
	'coffee',
	'dracula',
	'business',
	'synthwave',
] as const satisfies readonly AppTheme[]

export type NamedTheme = (typeof NAMED_THEMES)[number]

/** Themes that use the dark surface base (`.dark` class). */
export const DARK_BASE_THEMES = new Set<AppTheme>([
	'dark',
	'midnight',
	'dim',
	'night',
	'sunset',
	'abyss',
	'coffee',
	'dracula',
	'business',
	'synthwave',
])

export const THEME_LABELS: Record<AppTheme, string> = {
	auto: 'Auto',
	light: 'Light',
	dark: 'Dark',
	midnight: 'Midnight',
	paper: 'Paper',
	nord: 'Nord',
	cupcake: 'Cupcake',
	corporate: 'Corporate',
	winter: 'Winter',
	caramellatte: 'Caramel Latte',
	silk: 'Silk',
	dim: 'Dim',
	night: 'Night',
	sunset: 'Sunset',
	abyss: 'Abyss',
	coffee: 'Coffee',
	dracula: 'Dracula',
	business: 'Business',
	synthwave: 'Synthwave',
}

export function isNamedTheme(theme: AppTheme): theme is NamedTheme {
	return (NAMED_THEMES as readonly string[]).includes(theme)
}

export function resolveColorMode(
	theme: AppTheme,
	prefersDark = false
): 'dark' | 'light' {
	if (theme === 'auto') {
		return prefersDark ? 'dark' : 'light'
	}
	return DARK_BASE_THEMES.has(theme) ? 'dark' : 'light'
}
