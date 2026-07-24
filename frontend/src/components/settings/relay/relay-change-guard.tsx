import { useCallback, useEffect, useRef } from 'react'
import { useBlocker, useLocation } from 'react-router-dom'
import { useTranslation } from '../../../i18n'
import { shouldWarnDiscoveryChange } from '../../../lib/discovery-change-warning'
import { getRelayChangeWarningType } from '../../../lib/relay-change-warning'
import { buildRelayConfigArg } from '../../../lib/relay-config'
import { getDiscoveryConfigArg } from '../../../lib/discovery'
import { reconfigureNodeRelay } from '../../../lib/pairing-api'
import { useAppSettingStore } from '../../../store/app-setting'
import { useNodeCapability } from '../../../hooks/useNodeCapability'
import { IS_PAIRING_CAPABLE } from '@/lib/platform'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../../ui/alert-dialog'
import { Button } from '../../ui/button'

function syncNodeNetworkSettings(args: {
	relayMode: 'default' | 'custom' | 'disabled'
	relayUrls: string[]
	relayAuthToken: string
	relayFallback: 'strict' | 'public'
}) {
	return reconfigureNodeRelay(
		buildRelayConfigArg(args),
		getDiscoveryConfigArg()
	).catch((error) => {
		console.warn('Failed to reconfigure device node network settings:', error)
	})
}

function sameStringList(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false
	return a.every((value, index) => value === b[index])
}

// Lives in the settings layout (mounted for the whole settings visit, across
// every sub-tab) so we can warn when the user leaves settings after switching
// relays or discovery away from automatic — even if they wandered through
// other tabs first. Also applies silent network edits (URL/token) to the
// device node when leaving settings, so pairing keeps using the latest config.
export function RelayChangeGuard() {
	const { t } = useTranslation()
	const location = useLocation()
	const relayMode = useAppSettingStore((s) => s.relayMode)
	const relayUrls = useAppSettingStore((s) => s.relayUrls)
	const relayAuthToken = useAppSettingStore((s) => s.relayAuthToken)
	const relayFallback = useAppSettingStore((s) => s.relayFallback)
	const discoveryMode = useAppSettingStore((s) => s.discoveryMode)
	const pkarrRelayUrl = useAppSettingStore((s) => s.pkarrRelayUrl)
	const dnsOrigin = useAppSettingStore((s) => s.dnsOrigin)
	const { isNodeReady } = useNodeCapability()

	// Snapshot of network settings when the user entered settings. Comparing
	// against this means we only warn/sync on an actual change.
	const initialRelayModeRef = useRef(relayMode)
	const initialRelayFallbackRef = useRef(relayFallback)
	const initialRelayUrlsRef = useRef(relayUrls)
	const initialRelayAuthTokenRef = useRef(relayAuthToken)
	const initialDiscoveryModeRef = useRef(discoveryMode)
	const initialPkarrRelayUrlRef = useRef(pkarrRelayUrl)
	const initialDnsOriginRef = useRef(dnsOrigin)
	const wasInSettingsRef = useRef(location.pathname.startsWith('/settings'))
	const didSyncOnLeaveRef = useRef(false)

	const relayWarningType = getRelayChangeWarningType({
		initialMode: initialRelayModeRef.current,
		initialFallback: initialRelayFallbackRef.current,
		currentMode: relayMode,
		currentFallback: relayFallback,
	})

	const discoveryWarning = shouldWarnDiscoveryChange({
		initialMode: initialDiscoveryModeRef.current,
		currentMode: discoveryMode,
	})

	const shouldWarnLeave = relayWarningType !== null || discoveryWarning

	const networkSettingsChanged =
		relayMode !== initialRelayModeRef.current ||
		relayFallback !== initialRelayFallbackRef.current ||
		!sameStringList(relayUrls, initialRelayUrlsRef.current) ||
		relayAuthToken !== initialRelayAuthTokenRef.current ||
		discoveryMode !== initialDiscoveryModeRef.current ||
		pkarrRelayUrl.trim() !== initialPkarrRelayUrlRef.current.trim() ||
		dnsOrigin.trim() !== initialDnsOriginRef.current.trim()

	const shouldSyncNode =
		IS_PAIRING_CAPABLE && isNodeReady && networkSettingsChanged

	const blocker = useBlocker(
		useCallback(
			({
				currentLocation,
				nextLocation,
			}: {
				currentLocation: { pathname: string }
				nextLocation: { pathname: string }
			}) =>
				shouldWarnLeave &&
				currentLocation.pathname !== nextLocation.pathname &&
				!nextLocation.pathname.startsWith('/settings'),
			[shouldWarnLeave]
		)
	)

	const isLeaveDialogOpen = blocker.state === 'blocked'

	const cancelLeave = () => {
		if (blocker.state === 'blocked') blocker.reset()
	}

	const confirmLeave = () => {
		if (blocker.state === 'blocked') {
			didSyncOnLeaveRef.current = true
			blocker.proceed()
			if (IS_PAIRING_CAPABLE && isNodeReady) {
				void syncNodeNetworkSettings({
					relayMode,
					relayUrls,
					relayAuthToken,
					relayFallback,
				})
			}
		}
	}

	// When leaving settings without the warning dialog (e.g. URL-only edits
	// while already on custom), still push the new config to the device node.
	useEffect(() => {
		const inSettings = location.pathname.startsWith('/settings')
		const leftSettings = wasInSettingsRef.current && !inSettings
		wasInSettingsRef.current = inSettings

		if (!leftSettings) return
		if (didSyncOnLeaveRef.current) {
			didSyncOnLeaveRef.current = false
			return
		}
		if (!shouldSyncNode) return

		void syncNodeNetworkSettings({
			relayMode,
			relayUrls,
			relayAuthToken,
			relayFallback,
		})
	}, [
		location.pathname,
		shouldSyncNode,
		relayMode,
		relayUrls,
		relayAuthToken,
		relayFallback,
	])

	const dialogTitle = (() => {
		if (relayWarningType === 'disabled') {
			return t('settings.network.relay.confirmDisableTitle')
		}
		if (relayWarningType === 'custom') {
			return t('settings.network.relay.confirmCustomTitle')
		}
		return t('settings.network.discovery.confirmCustomTitle')
	})()

	const dialogDescription = (() => {
		const parts: string[] = []
		if (relayWarningType === 'disabled') {
			parts.push(t('settings.network.relay.confirmDisableDescription'))
		} else if (relayWarningType === 'custom') {
			parts.push(t('settings.network.relay.confirmCustomDescriptionWithPolicy'))
		}
		if (discoveryWarning) {
			parts.push(t('settings.network.discovery.confirmCustomDescription'))
		}
		return parts
	})()

	return (
		<AlertDialog
			open={isLeaveDialogOpen}
			onOpenChange={(open) => {
				if (!open) cancelLeave()
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
					<AlertDialogDescription>
						{dialogDescription.map((part, index) => (
							<span key={part}>
								{index > 0 ? (
									<>
										<br />
										<br />
									</>
								) : null}
								{part}
							</span>
						))}
						{IS_PAIRING_CAPABLE && isNodeReady ? (
							<>
								<br />
								<br />
								{t('common:settings.devices.relayChangePairedHint')}
							</>
						) : null}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<Button variant="secondary" size="sm" onClick={cancelLeave}>
						{t('common:cancel')}
					</Button>
					<Button size="sm" onClick={confirmLeave}>
						{relayWarningType !== null
							? t('settings.network.relay.confirmContinue')
							: t('settings.network.discovery.confirmContinue')}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
