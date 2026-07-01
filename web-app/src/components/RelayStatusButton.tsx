import { useEffect, useMemo, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { buttonVariants } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { LazyIcon } from './icons'
import { useTranslation } from '@/i18n'
import { buildRelayStatusConfig } from '@/lib/relay-status'
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
	const relayFallback = useAppSettingStore((s) => s.relayFallback)

	const [status, setStatus] = useState<RelayStatusResponse | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [showInfo, setShowInfo] = useState(false)

	const relayConfig = useMemo(
		() =>
			buildRelayStatusConfig({
				relayMode,
				relayUrls,
				relayAuthToken,
				relayFallback,
			}),
		[relayMode, relayUrls, relayAuthToken, relayFallback]
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
		!isLoading && !didFallBack && displayKind === 'custom' && 'text-[#3660FD]',
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
					name="Network"
					weight="fill"
					size={16}
					className={iconClassName}
				/>
			</PopoverTrigger>
			<PopoverContent className="w-72 px-1 py-1 text-left text-sm" side="top">
				<div className="relative">
					{showInfo && (
						<div className="mb-3 space-y-2 border-border border-b pb-3 text-muted-foreground text-xs">
							{displayKind === 'disabled' ? (
								<div className="flex items-start gap-2">
									<LazyIcon name="Info" size={14} className="mt-px shrink-0" />
									<span>{t('footer.relay.disabledNote')}</span>
								</div>
							) : (
								<>
									<div className="flex items-start gap-2">
										<LazyIcon
											name="MagnifyingGlass"
											size={14}
											className="mt-px shrink-0"
										/>
										<span>{t('footer.relay.purpose')}</span>
									</div>
									<div className="flex items-start gap-2">
										<LazyIcon
											name="ArrowRight"
											size={14}
											className="mt-px shrink-0"
										/>
										<span>{t('footer.relay.directNote')}</span>
									</div>
									<div className="flex items-start gap-2">
										<LazyIcon
											name="House"
											size={14}
											className="mt-px shrink-0"
										/>
										<span>{t('footer.relay.lanNote')}</span>
									</div>
									<div className="flex items-start gap-2">
										<LazyIcon
											name="CheckCircle"
											size={14}
											className="mt-px shrink-0"
										/>
										<span>{t('footer.relay.encryptedNote')}</span>
									</div>
								</>
							)}
						</div>
					)}

					<div className="relative pr-7">
						<button
							type="button"
							onClick={() => setShowInfo((value) => !value)}
							aria-label={t('footer.relay.infoToggle')}
							aria-expanded={showInfo}
							className={cn(
								'absolute -top-1 -right-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
								showInfo && 'bg-muted text-foreground'
							)}
						>
							<LazyIcon name="Info" size={16} />
						</button>
						<p className="font-medium">{t(headingKey)}</p>
						{didFallBack && (
							<p className="mt-1 text-amber-600 text-xs dark:text-amber-400">
								{t('footer.relay.fellBackToPublic')}
							</p>
						)}
						{status?.url && (
							<p className="mt-1 break-all text-muted-foreground text-xs">
								{status.url}
							</p>
						)}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
