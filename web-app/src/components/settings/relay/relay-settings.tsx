import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Loader2, Minus, Plus } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useAppSettingStore } from '../../../store/app-setting'
import type { RelayConfigArg, VerifyRelaysResponse } from '../../../lib/relay'
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

function isValidRelayUrl(url: string): boolean {
	try {
		const parsed = new URL(url)
		return parsed.protocol === 'https:' || parsed.protocol === 'http:'
	} catch {
		return false
	}
}

export function RelaySettings() {
	const { t } = useTranslation()
	const relayMode = useAppSettingStore((s) => s.relayMode)
	const relayUrls = useAppSettingStore((s) => s.relayUrls)
	const relayAuthToken = useAppSettingStore((s) => s.relayAuthToken)
	const setRelayMode = useAppSettingStore((s) => s.setRelayMode)
	const setRelayUrls = useAppSettingStore((s) => s.setRelayUrls)
	const setRelayAuthToken = useAppSettingStore((s) => s.setRelayAuthToken)

	const [isTesting, setIsTesting] = useState(false)
	const [showAuthToken, setShowAuthToken] = useState(
		() => relayAuthToken.trim().length > 0
	)
	const urlRowIdsRef = useRef<string[]>([])

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

	const updateUrl = (index: number, value: string) => {
		const next = [...relayUrls]
		next[index] = value
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

	const buildVerifyPayload = (): RelayConfigArg | null => {
		const trimmedUrls = relayUrls.map((u) => u.trim()).filter(Boolean)

		if (relayMode === 'custom') {
			if (trimmedUrls.length === 0) {
				toastManager.add({
					title: t('settings.network.relay.verifyFailed'),
					description: t('settings.network.relay.urlRequired'),
					type: 'error',
				})
				return null
			}

			const invalid = trimmedUrls.find((url) => !isValidRelayUrl(url))
			if (invalid) {
				toastManager.add({
					title: t('settings.network.relay.verifyFailed'),
					description: t('settings.network.relay.invalidUrl', { url: invalid }),
					type: 'error',
				})
				return null
			}
		}

		return {
			mode: relayMode,
			urls: trimmedUrls,
			auth_token: relayAuthToken.trim() || null,
		}
	}

	const handleTestConnection = async () => {
		const payload = buildVerifyPayload()
		if (!payload) return

		if (payload.mode === 'disabled') {
			toastManager.add({
				title: t('settings.network.relay.verifyFailed'),
				description: t('settings.network.relay.disabledHint'),
				type: 'info',
			})
			return
		}

		setIsTesting(true)
		try {
			const result = await invoke<VerifyRelaysResponse>('verify_relays', {
				relay: payload,
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
							{relayUrls.map((url, index) => (
								<div
									key={urlRowIdsRef.current[index]}
									className="flex gap-2"
								>
									<Input
										value={url}
										onChange={(e) => updateUrl(index, e.target.value)}
										placeholder="https://relay.example.com"
										aria-invalid={
											url.trim().length > 0 && !isValidRelayUrl(url.trim())
										}
									/>
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
							))}
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
									onChange={(e) => setRelayAuthToken(e.target.value)}
									placeholder={t(
										'settings.network.relay.authTokenPlaceholder'
									)}
									autoComplete="off"
								/>
							)}
							<FrameDescription>
								{t('settings.network.relay.authTokenDescription')}
							</FrameDescription>
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
					{isTesting ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : null}
					{t('settings.network.relay.testConnection')}
				</Button>
			</FrameFooter>
		</Frame>
	)
}
