import { openUrl } from '@tauri-apps/plugin-opener'
import { getVersionLink, VERSION_DISPLAY } from '@/lib/version'
import { Button } from '../ui/button'

export function AppVersionInline({
	size = 'icon',
	variant = 'link',
	...props
}: React.ComponentProps<typeof Button>) {
	return (
		<Button
			size={size}
			variant={variant}
			{...props}
			onClick={() => {
				const url = getVersionLink(VERSION_DISPLAY)
				openUrl(url)
			}}
		>
			{VERSION_DISPLAY}
		</Button>
	)
}
