import { useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { buttonVariants } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { LazyIcon } from './icons'
import { useTranslation } from '@/i18n'
import { useAppSettingStore } from '@/store/app-setting'
import { cn } from '@/lib/utils'

type RelayStatusKind = 'public' | 'custom' | 'disabled' | 'unavailable'

type RelayStatusResponse = {
	kind: RelayStatusKind
	url: string | null
	connected: boolean
	fellBackToPublic: boolean
}

export function RelayStatusButton() {
	const { t } = useTranslation()
	const relayMode = useAppSettingStore((s) => s.relayMode)
	const relayUrls = useAppSettingStore((s) => s.relayUrls)
	const relayAuthToken = useAppSettingStore((s) => s.relayAuthToken)

	const [status, setStatus] = useState<RelayStatusResponse | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	const relayConfig = useMemo(
		() => ({
			mode: relayMode,
			urls: relayUrls.map((url) => url.trim()).filter(Boolean),
			auth_token: relayAuthToken.trim() || null,
		}),
		[relayMode, relayUrls, relayAuthToken]
	)

	useEffect(() => {
		let cancelled = false

		const load = async () => {
			setIsLoading(true)
			try {
				const response = await invoke<RelayStatusResponse>('get_relay_status', {
					relay: relayConfig,
				})
				if (!cancelled) {
					setStatus(response)
				}
			} catch (error) {
				console.warn('Failed to fetch relay status:', error)
				if (!cancelled) {
					setStatus({
						kind: 'unavailable',
						url: null,
						connected: false,
						fellBackToPublic: false,
					})
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false)
				}
			}
		}

		void load()

		return () => {
			cancelled = true
		}
	}, [relayConfig])

	const activeKind: RelayStatusKind = status?.connected
		? status.kind
		: status?.kind === 'disabled'
			? 'disabled'
			: 'unavailable'

	const didFallBack = Boolean(status?.connected && status.fellBackToPublic)

	const displayKind: RelayStatusKind = didFallBack ? 'public' : activeKind

	const iconClassName = cn(
		isLoading && 'text-muted-foreground/50',
		!isLoading && didFallBack && 'text-amber-500 dark:text-amber-400',
		!isLoading &&
			!didFallBack &&
			displayKind === 'custom' &&
			'text-[#3660FD]',
		!isLoading &&
			!didFallBack &&
			displayKind === 'public' &&
			'text-muted-foreground',
		!isLoading &&
			(displayKind === 'disabled' || displayKind === 'unavailable') &&
			'text-muted-foreground/40'
	)

	const headingKey =
		displayKind === 'custom'
			? 'footer.relay.customHeading'
			: displayKind === 'public'
				? 'footer.relay.publicHeading'
				: displayKind === 'disabled'
					? 'footer.relay.disabledHeading'
					: 'footer.relay.unavailableHeading'

	return (
		<Popover>
			<PopoverTrigger
				className={buttonVariants({
					size: 'icon-sm',
					variant: 'outline',
				})}
				aria-label={t('footer.relay.ariaLabel')}
			>
				<LazyIcon
					name="House"
					weight="fill"
					size={16}
					className={iconClassName}
				/>
			</PopoverTrigger>
			<PopoverContent className="max-w-xs text-left" side="top" tooltipStyle>
				<p className="font-medium">{t(headingKey)}</p>
				{didFallBack && (
					<p className="mt-1 text-amber-600 dark:text-amber-400">
						{t('footer.relay.fellBackToPublic')}
					</p>
				)}
				{status?.url && (
					<p className="mt-1 break-all text-muted-foreground">{status.url}</p>
				)}
			</PopoverContent>
		</Popover>
	)
}
