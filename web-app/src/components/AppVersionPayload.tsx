import type { PopoverTriggerProps } from '@base-ui/react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { InfoIcon } from 'lucide-react'
import { VERSION_DISPLAY } from '@/lib/version'
import { buttonVariants } from './ui/button'
import { cn } from '@/lib/utils'

export function AppVersion(props: PopoverTriggerProps) {
	return (
		<Popover modal={true}>
			<PopoverTrigger
				{...props}
				openOnHover
				className={cn(
					buttonVariants({ variant: 'outline', size: 'sm' }),
					props.className
				)}
			>
				<InfoIcon />
			</PopoverTrigger>
			<PopoverContent className="text-sm space-y-4" tooltipStyle align="end">
				<p className="text-muted-foreground">Version</p>
				<div className="text-sm flex items-center gap-1.5 cursor-default">
					<span className="font-mono ml-1">{VERSION_DISPLAY}</span>
				</div>
			</PopoverContent>
		</Popover>
	)
}
