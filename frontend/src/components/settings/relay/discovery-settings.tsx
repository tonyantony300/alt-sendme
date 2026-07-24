import { useState, type ChangeEvent } from 'react'
import { invoke } from '@/lib/platform-api'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { handleExternalLinkClick } from '../../../lib/openExternalUrl'
import { IS_WEB } from '../../../lib/platform'
import { useAppSettingStore } from '../../../store/app-setting'
import { DISCOVERY_DOCS_LINK } from '../../../lib/version'
import {
	DISCOVERY_URL_INVALID_MESSAGE_KEY,
	DNS_ORIGIN_INVALID_MESSAGE_KEY,
	MAX_DISCOVERY_URL_LENGTH,
	MAX_DNS_ORIGIN_LENGTH,
	isValidDiscoveryUrl,
	isValidDnsOrigin,
} from '../../../lib/discovery-url-validation'
import type { VerifyDiscoveryResponse } from '../../../lib/discovery'
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

function isDisallowedUrlChar(char: string): boolean {
	const code = char.charCodeAt(0)
	if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
		return true
	}
	return /\s/u.test(char)
}

function sanitizeUrlInput(value: string): string {
	const sanitized: string[] = []
	for (const char of value) {
		if (isDisallowedUrlChar(char)) continue
		sanitized.push(char)
		if (sanitized.length >= MAX_DISCOVERY_URL_LENGTH) break
	}
	return sanitized.join('')
}

function sanitizeDnsOriginInput(value: string): string {
	const sanitized: string[] = []
	for (const char of value) {
		if (isDisallowedUrlChar(char)) continue
		sanitized.push(char)
		if (sanitized.length >= MAX_DNS_ORIGIN_LENGTH) break
	}
	return sanitized.join('')
}

// Self-hosted discovery (a custom pkarr relay) is only wired up on native
// platforms for v1; browsers always use the default n0 discovery.
export function DiscoverySettings() {
	const { t } = useTranslation()
	const discoveryMode = useAppSettingStore((s) => s.discoveryMode)
	const pkarrRelayUrl = useAppSettingStore((s) => s.pkarrRelayUrl)
	const dnsOrigin = useAppSettingStore((s) => s.dnsOrigin)
	const setDiscoveryMode = useAppSettingStore((s) => s.setDiscoveryMode)
	const setPkarrRelayUrl = useAppSettingStore((s) => s.setPkarrRelayUrl)
	const setDnsOrigin = useAppSettingStore((s) => s.setDnsOrigin)

	const [isTesting, setIsTesting] = useState(false)
	const [verifyStatus, setVerifyStatus] = useState<'idle' | 'ok' | 'failed'>(
		'idle'
	)

	if (IS_WEB) return null

	const trimmed = pkarrRelayUrl.trim()
	const trimmedOrigin = dnsOrigin.trim()
	const isValidFormat = trimmed.length > 0 && isValidDiscoveryUrl(trimmed)
	const isInvalidFormat = trimmed.length > 0 && !isValidFormat
	const isOriginInvalid =
		trimmedOrigin.length > 0 && !isValidDnsOrigin(trimmedOrigin)

	const handleModeChange = (value: string) => {
		setDiscoveryMode(value as 'default' | 'custom')
		setVerifyStatus('idle')
	}

	const updateUrl = (value: string) => {
		setPkarrRelayUrl(sanitizeUrlInput(value))
		setVerifyStatus('idle')
	}

	const updateDnsOrigin = (value: string) => {
		setDnsOrigin(sanitizeDnsOriginInput(value))
		setVerifyStatus('idle')
	}

	const handleTestConnection = async () => {
		if (!isValidFormat || isOriginInvalid) {
			toastManager.add({
				title: t('settings.network.discovery.verifyFailed'),
				description: isOriginInvalid
					? t(DNS_ORIGIN_INVALID_MESSAGE_KEY)
					: t(DISCOVERY_URL_INVALID_MESSAGE_KEY),
				type: 'error',
			})
			return
		}

		setIsTesting(true)
		setVerifyStatus('idle')
		try {
			const result = await invoke<VerifyDiscoveryResponse>('verify_discovery', {
				discovery: {
					mode: 'custom',
					pkarr_relay_url: trimmed,
					dns_origin: trimmedOrigin.length > 0 ? trimmedOrigin : null,
				},
			})
			setVerifyStatus('ok')
			toastManager.add({
				title: t('settings.network.discovery.verifySuccess'),
				description: result.url
					? t('settings.network.discovery.verifySuccessDesc', {
							url: result.url,
							latency: result.latencyMs,
						})
					: t('settings.network.discovery.verifySuccessDescGeneric'),
				type: 'success',
			})
		} catch (error) {
			setVerifyStatus('failed')
			toastManager.add({
				title: t('settings.network.discovery.verifyFailed'),
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
					<FrameTitle>{t('settings.network.discovery.title')}</FrameTitle>
					<FrameDescription>
						{t('settings.network.discovery.description')}
					</FrameDescription>
				</div>

				<RadioGroup value={discoveryMode} onValueChange={handleModeChange}>
					<button
						type="button"
						onClick={() => handleModeChange('default')}
						className="flex cursor-pointer items-start gap-3 text-left"
					>
						<RadioGroupItem value="default" className="mt-0.5" />
						<div>
							<div className="text-sm font-medium">
								{t('settings.network.discovery.modeDefault')}
							</div>
							<div className="text-sm text-muted-foreground">
								{t('settings.network.discovery.modeDefaultDesc')}
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
								{t('settings.network.discovery.modeCustom')}
							</div>
							<div className="text-sm text-muted-foreground">
								{t('settings.network.discovery.modeCustomDesc')}{' '}
								<a
									href={DISCOVERY_DOCS_LINK}
									onClick={(event) =>
										handleExternalLinkClick(event, DISCOVERY_DOCS_LINK)
									}
									target="_blank"
									rel="noopener noreferrer"
									className="underline hover:text-foreground"
								>
									{t('settings.network.discovery.docsLink')}
								</a>
							</div>
						</div>
					</button>
				</RadioGroup>

				{discoveryMode === 'custom' && (
					<div className="space-y-4 rounded-lg border border-border p-4">
						<div className="space-y-2">
							<Label>{t('settings.network.discovery.urlLabel')}</Label>
							<FrameDescription>
								{t('settings.network.discovery.urlDescription')}
							</FrameDescription>
						</div>

						<div className="space-y-1">
							<div className="relative">
								<Input
									value={pkarrRelayUrl}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										updateUrl(e.target.value)
									}
									placeholder="https://dns.example.com/pkarr"
									aria-invalid={isInvalidFormat || verifyStatus === 'failed'}
									inputMode="url"
									maxLength={2048}
									className="pr-8"
								/>
								{verifyStatus === 'ok' && (
									<Check
										className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-emerald-500"
										aria-label={t('settings.network.discovery.urlVerified')}
									/>
								)}
								{(verifyStatus === 'failed' ||
									(isInvalidFormat && verifyStatus !== 'ok')) && (
									<AlertCircle
										className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-destructive"
										aria-hidden="true"
									/>
								)}
							</div>
							{isInvalidFormat && (
								<p className="pl-1 text-xs text-destructive">
									{t(DISCOVERY_URL_INVALID_MESSAGE_KEY)}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label>{t('settings.network.discovery.dnsOriginLabel')}</Label>
							<FrameDescription>
								{t('settings.network.discovery.dnsOriginDescription')}
							</FrameDescription>
						</div>

						<div className="space-y-1">
							<Input
								value={dnsOrigin}
								onChange={(e: ChangeEvent<HTMLInputElement>) =>
									updateDnsOrigin(e.target.value)
								}
								placeholder="example.com"
								aria-invalid={isOriginInvalid}
								maxLength={MAX_DNS_ORIGIN_LENGTH}
							/>
							{isOriginInvalid && (
								<p className="pl-1 text-xs text-destructive">
									{t(DNS_ORIGIN_INVALID_MESSAGE_KEY)}
								</p>
							)}
						</div>

						<FrameDescription>
							{t('settings.network.discovery.privacyNote')}
						</FrameDescription>
					</div>
				)}
			</FramePanel>

			<FrameFooter className="flex-row justify-end">
				<Button
					variant="secondary"
					onClick={handleTestConnection}
					disabled={isTesting || discoveryMode !== 'custom' || isOriginInvalid}
					className={cn(discoveryMode !== 'custom' && 'opacity-50')}
				>
					{isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
					{t('settings.network.discovery.testConnection')}
				</Button>
			</FrameFooter>
		</Frame>
	)
}
