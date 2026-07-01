import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { AlertCircle, Check, Loader2, Minus, Plus } from 'lucide-react'
import ReactCountryFlag from 'react-country-flag'
import { useTranslation } from '../../../i18n'
import { useAppSettingStore } from '../../../store/app-setting'
import { relayAuthTokenForIpc } from '../../../lib/relay-auth-token'
import {
	RELAY_FALLBACK_OPTIONS,
	relayFallbackFromRadioValue,
} from '../../../lib/relay-fallback-options'
import {
	MAX_RELAY_URL_LENGTH,
	RELAY_URL_INVALID_MESSAGE_KEY,
	isValidRelayUrl,
} from '../../../lib/relay-url-validation'
import { getRelayRegion } from '../../../lib/relay'
import type { VerifyRelaysResponse } from '../../../lib/relay'
import { cn } from '../../../lib/utils'
import { Button } from '../../ui/button'
import {
	Frame,
	FrameDescription,
	FrameFooter,
	FramePanel,
	FrameTitle,
} from '../../ui/frame'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group'
import { toastManager } from '../../ui/toast'

function isDisallowedRelayUrlChar(char: string): boolean {
	const code = char.charCodeAt(0)
	// C0 controls (0x00-0x1f), DEL (0x7f), and C1 controls (0x80-0x9f).
	if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
		return true
	}
	return /\s/u.test(char)
}

// Strip whitespace and control characters and cap the length so the field can't
// be used to smuggle hidden characters or pathologically large strings.
function sanitizeRelayUrlInput(value: string): string {
	const sanitized: string[] = []
	for (const char of value) {
		if (isDisallowedRelayUrlChar(char)) continue
		sanitized.push(char)
		if (sanitized.length >= MAX_RELAY_URL_LENGTH) break
	}
	return sanitized.join('')
}

export function RelaySettings() {
	const { t } = useTranslation()
	const relayMode = useAppSettingStore((s) => s.relayMode)
	const relayUrls = useAppSettingStore((s) => s.relayUrls)
	const relayAuthToken = useAppSettingStore((s) => s.relayAuthToken)
	const relayFallback = useAppSettingStore((s) => s.relayFallback)
	const setRelayMode = useAppSettingStore((s) => s.setRelayMode)
	const setRelayUrls = useAppSettingStore((s) => s.setRelayUrls)
	const setRelayAuthToken = useAppSettingStore((s) => s.setRelayAuthToken)
	const setRelayFallback = useAppSettingStore((s) => s.setRelayFallback)

	const [isTesting, setIsTesting] = useState(false)
	const [verifyResults, setVerifyResults] = useState<
		Record<string, 'checking' | 'ok' | 'failed'>
	>({})
	const [showAuthToken, setShowAuthToken] = useState(
		() => relayAuthToken.trim().length > 0
	)
	const urlRowIdsRef = useRef<string[]>(
		relayUrls.map(() => crypto.randomUUID())
	)

	useEffect(() => {
		while (urlRowIdsRef.current.length < relayUrls.length) {
			urlRowIdsRef.current.push(crypto.randomUUID())
		}
		if (urlRowIdsRef.current.length > relayUrls.length) {
			urlRowIdsRef.current = urlRowIdsRef.current.slice(0, relayUrls.length)
		}
	}, [relayUrls.length])

	const handleModeChange = (value: string) => {
		setRelayMode(value as 'default' | 'custom' | 'disabled')
		if (value === 'custom' && relayUrls.length === 0) {
			setRelayUrls([''])
		}
	}

	const handleFallbackChange = (value: string) => {
		setRelayFallback(relayFallbackFromRadioValue(value))
	}

	const updateUrl = (index: number, value: string) => {
		const next = [...relayUrls]
		next[index] = sanitizeRelayUrlInput(value)
		setRelayUrls(next)
	}

	const addUrl = () => {
		setRelayUrls([...relayUrls, ''])
	}

	const removeUrl = (index: number) => {
		if (relayUrls.length <= 1) {
			setRelayUrls([''])
			return
		}
		setRelayUrls(relayUrls.filter((_, i) => i !== index))
	}

	const verifyCustomRelays = async () => {
		const trimmedUrls = relayUrls.map((u) => u.trim()).filter(Boolean)

		if (trimmedUrls.length === 0) {
			toastManager.add({
				title: t('settings.network.relay.verifyFailed'),
				description: t('settings.network.relay.urlRequired'),
				type: 'error',
			})
			return
		}

		const invalid = trimmedUrls.find((url) => !isValidRelayUrl(url))
		if (invalid) {
			toastManager.add({
				title: t('settings.network.relay.verifyFailed'),
				description: t(RELAY_URL_INVALID_MESSAGE_KEY),
				type: 'error',
			})
			return
		}

		const authToken = relayAuthTokenForIpc(relayAuthToken)
		if (authToken !== null) {
			const cleartextUrl = trimmedUrls.find(
				(url) => new URL(url).protocol !== 'https:'
			)
			if (cleartextUrl) {
				toastManager.add({
					title: t('settings.network.relay.verifyFailed'),
					description: t(RELAY_URL_INVALID_MESSAGE_KEY),
					type: 'error',
				})
				return
			}
		}

		const uniqueUrls = [...new Set(trimmedUrls)]

		setIsTesting(true)
		setVerifyResults((prev) => {
			const next = { ...prev }
			for (const url of uniqueUrls) next[url] = 'checking'
			return next
		})

		const outcomes = await Promise.all(
			uniqueUrls.map(async (url) => {
				try {
					await invoke<VerifyRelaysResponse>('verify_relays', {
						relay: {
							mode: 'custom',
							urls: [url],
							auth_token: authToken,
							fallback: relayFallback,
						},
					})
					return { url, ok: true }
				} catch {
					return { url, ok: false }
				}
			})
		)

		setVerifyResults((prev) => {
			const next = { ...prev }
			for (const { url, ok } of outcomes) next[url] = ok ? 'ok' : 'failed'
			return next
		})
		setIsTesting(false)

		const okCount = outcomes.filter((o) => o.ok).length
		const allOk = okCount === uniqueUrls.length
		// iroh can't distinguish auth rejection from an unreachable relay, so when a
		// token is configured and any relay failed, surface it as a likely cause.
		const showAuthHint = !allOk && authToken !== null
		const summary = t('settings.network.relay.verifySummary', {
			ok: okCount,
			total: uniqueUrls.length,
		})
		toastManager.add({
			title: allOk
				? t('settings.network.relay.verifySuccess')
				: t('settings.network.relay.verifyFailed'),
			description: showAuthHint
				? `${summary} ${t('settings.network.relay.verifyAuthHint')}`
				: summary,
			type: allOk ? 'success' : okCount > 0 ? 'info' : 'error',
		})
	}

	const handleTestConnection = async () => {
		if (relayMode === 'disabled') {
			toastManager.add({
				title: t('settings.network.relay.verifyFailed'),
				description: t('settings.network.relay.disabledHint'),
				type: 'info',
			})
			return
		}

		if (relayMode === 'custom') {
			await verifyCustomRelays()
			return
		}

		setIsTesting(true)
		try {
			const result = await invoke<VerifyRelaysResponse>('verify_relays', {
				relay: {
					mode: relayMode,
					urls: [],
					auth_token: null,
					fallback: relayFallback,
				},
			})
			toastManager.add({
				title: t('settings.network.relay.verifySuccess'),
				description: result.url
					? t('settings.network.relay.verifySuccessDesc', {
							url: result.url,
							latency: result.latencyMs,
						})
					: t('settings.network.relay.verifySuccessDescGeneric'),
				type: 'success',
			})
		} catch (error) {
			toastManager.add({
				title: t('settings.network.relay.verifyFailed'),
				description: String(error),
				type: 'error',
			})
		} finally {
			setIsTesting(false)
		}
	}

	return (
		<Frame>
			<FramePanel className="flex flex-col gap-6">
				<div className="space-y-2">
					<FrameTitle>{t('settings.network.relay.title')}</FrameTitle>
					<FrameDescription>
						{t('settings.network.relay.description')}
					</FrameDescription>
				</div>

				<RadioGroup value={relayMode} onValueChange={handleModeChange}>
					<button
						type="button"
						onClick={() => handleModeChange('default')}
						className="flex cursor-pointer items-start gap-3 text-left"
					>
						<RadioGroupItem value="default" className="mt-0.5" />
						<div>
							<div className="text-sm font-medium">
								{t('settings.network.relay.modeDefault')}
							</div>
							<div className="text-sm text-muted-foreground">
								{t('settings.network.relay.modeDefaultDesc')}
							</div>
						</div>
					</button>

					<button
						type="button"
						onClick={() => handleModeChange('custom')}
						className="flex cursor-pointer items-start gap-3 text-left"
					>
						<RadioGroupItem value="custom" className="mt-0.5" />
						<div>
							<div className="text-sm font-medium">
								{t('settings.network.relay.modeCustom')}
							</div>
							<div className="text-sm text-muted-foreground">
								{t('settings.network.relay.modeCustomDesc')}
							</div>
						</div>
					</button>

					<button
						type="button"
						onClick={() => handleModeChange('disabled')}
						className="flex cursor-pointer items-start gap-3 text-left"
					>
						<RadioGroupItem value="disabled" className="mt-0.5" />
						<div>
							<div className="text-sm font-medium">
								{t('settings.network.relay.modeDisabled')}
							</div>
							<div className="text-sm text-muted-foreground">
								{t('settings.network.relay.modeDisabledDesc')}
							</div>
						</div>
					</button>
				</RadioGroup>

				{relayMode === 'custom' && (
					<div className="space-y-4 rounded-lg border border-border p-4">
						<div className="space-y-2">
							<Label>{t('settings.network.relay.urlsLabel')}</Label>
							<FrameDescription>
								{t('settings.network.relay.urlsDescription')}
							</FrameDescription>
						</div>

						<div className="space-y-2">
							{relayUrls.map((url, index) => {
								const trimmed = url.trim()
								const isValidFormat =
									trimmed.length > 0 && isValidRelayUrl(trimmed)
								const isInvalidFormat = trimmed.length > 0 && !isValidFormat
								const status = isValidFormat
									? verifyResults[trimmed]
									: undefined
								const region = isValidFormat ? getRelayRegion(trimmed) : null

								return (
									<div key={urlRowIdsRef.current[index]} className="space-y-1">
										<div className="flex items-center gap-2">
											<div className="relative flex-1">
												{region && (
													<ReactCountryFlag
														countryCode={region.countryCode}
														svg
														title={region.regionCode.toUpperCase()}
														aria-label={region.regionCode.toUpperCase()}
														className="pointer-events-none absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-[0.2em]"
														style={{ width: '1.1em', height: '1.1em' }}
													/>
												)}
												<Input
													value={url}
													onChange={(e: ChangeEvent<HTMLInputElement>) =>
														updateUrl(index, e.target.value)
													}
													placeholder="https://euc1-1.relay.example.com"
													aria-invalid={isInvalidFormat || status === 'failed'}
													inputMode="url"
													maxLength={2048}
													className={cn('pr-8', region && 'pl-7')}
												/>
												{status === 'checking' && (
													<Loader2
														className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
														aria-label={t('settings.network.relay.urlChecking')}
													/>
												)}
												{status === 'ok' && (
													<Check
														className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-emerald-500"
														aria-label={t('settings.network.relay.urlVerified')}
													/>
												)}
												{(status === 'failed' ||
													(isInvalidFormat && !status)) && (
													<AlertCircle
														className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-destructive"
														aria-hidden="true"
													/>
												)}
											</div>
											<Button
												type="button"
												variant="outline"
												size="icon"
												onClick={() => removeUrl(index)}
												disabled={relayUrls.length === 1 && !url.trim()}
												aria-label={t('settings.network.relay.removeUrl')}
											>
												<Minus className="h-4 w-4" />
											</Button>
										</div>
										{isInvalidFormat && (
											<p className="pl-1 text-xs text-destructive">
												{t(RELAY_URL_INVALID_MESSAGE_KEY)}
											</p>
										)}
										{!isInvalidFormat && status === 'failed' && (
											<p className="pl-1 text-xs text-destructive">
												{t('settings.network.relay.urlVerifyFailedHint')}
											</p>
										)}
									</div>
								)
							})}
						</div>

						<Button type="button" variant="outline" size="sm" onClick={addUrl}>
							<Plus className="mr-2 h-4 w-4" />
							{t('settings.network.relay.addUrl')}
						</Button>

						<div className="space-y-2">
							<div className="flex items-center justify-between gap-2">
								<Label>{t('settings.network.relay.authTokenLabel')}</Label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setShowAuthToken((v) => !v)}
								>
									{showAuthToken
										? t('settings.network.relay.hideAuthToken')
										: t('settings.network.relay.showAuthToken')}
								</Button>
							</div>
							{showAuthToken && (
								<Input
									type="password"
									value={relayAuthToken}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setRelayAuthToken(e.target.value)
									}
									placeholder={t('settings.network.relay.authTokenPlaceholder')}
									autoComplete="off"
								/>
							)}
							<FrameDescription>
								{t('settings.network.relay.authTokenDescription')}
							</FrameDescription>
						</div>

						<div className="space-y-2">
							<div className="space-y-1">
								<Label>{t('settings.network.relay.fallbackLabel')}</Label>
								<FrameDescription>
									{t('settings.network.relay.fallbackDescription')}
								</FrameDescription>
							</div>
							<RadioGroup
								value={relayFallback}
								onValueChange={handleFallbackChange}
								className="gap-2"
							>
								{RELAY_FALLBACK_OPTIONS.map((option) => (
									<button
										key={option.value}
										type="button"
										onClick={() => setRelayFallback(option.value)}
										className="flex cursor-pointer items-start gap-3 text-left"
									>
										<RadioGroupItem value={option.value} className="mt-0.5" />
										<div>
											<div className="text-sm font-medium">
												{t(option.labelKey)}
											</div>
											<div className="text-sm text-muted-foreground">
												{t(option.descriptionKey)}
											</div>
										</div>
									</button>
								))}
							</RadioGroup>
						</div>

						<FrameDescription>
							{t('settings.network.relay.privacyNote')}
						</FrameDescription>
					</div>
				)}
			</FramePanel>

			<FrameFooter className="flex-row justify-end">
				<Button
					variant="secondary"
					onClick={handleTestConnection}
					disabled={isTesting || relayMode === 'disabled'}
				>
					{isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
					{t('settings.network.relay.testConnection')}
				</Button>
			</FrameFooter>
		</Frame>
	)
}
