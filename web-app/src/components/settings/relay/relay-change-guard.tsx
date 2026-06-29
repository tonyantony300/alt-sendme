import { useCallback, useRef } from 'react'
import { useBlocker } from 'react-router-dom'
import { useTranslation } from '../../../i18n'
import { getRelayChangeWarningType } from '../../../lib/relay-change-warning'
import { useAppSettingStore } from '../../../store/app-setting'
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../../ui/alert-dialog'
import { Button } from '../../ui/button'

// Lives in the settings layout (mounted for the whole settings visit, across
// every sub-tab) so we can warn when the user leaves settings after switching
// relays away from automatic — even if they wandered through other tabs first.
export function RelayChangeGuard() {
	const { t } = useTranslation()
	const relayMode = useAppSettingStore((s) => s.relayMode)
	const relayFallback = useAppSettingStore((s) => s.relayFallback)

	// The mode the user arrived in settings with. Comparing against this means we
	// only warn on an actual change and never nag users who already had a
	// non-default relay configured.
	const initialRelayModeRef = useRef(relayMode)
	const initialRelayFallbackRef = useRef(relayFallback)

	const warningType = getRelayChangeWarningType({
		initialMode: initialRelayModeRef.current,
		initialFallback: initialRelayFallbackRef.current,
		currentMode: relayMode,
		currentFallback: relayFallback,
	})

	const blocker = useBlocker(
		useCallback(
			({
				currentLocation,
				nextLocation,
			}: {
				currentLocation: { pathname: string }
				nextLocation: { pathname: string }
			}) =>
				warningType !== null &&
				currentLocation.pathname !== nextLocation.pathname &&
				!nextLocation.pathname.startsWith('/settings'),
			[warningType]
		)
	)

	const isLeaveDialogOpen = blocker.state === 'blocked'

	const cancelLeave = () => {
		if (blocker.state === 'blocked') blocker.reset()
	}

	const confirmLeave = () => {
		if (blocker.state === 'blocked') blocker.proceed()
	}

	return (
		<AlertDialog
			open={isLeaveDialogOpen}
			onOpenChange={(open) => {
				if (!open) cancelLeave()
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{warningType === 'disabled'
							? t('settings.network.relay.confirmDisableTitle')
							: t('settings.network.relay.confirmCustomTitle')}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{warningType === 'disabled'
							? t('settings.network.relay.confirmDisableDescription')
							: t('settings.network.relay.confirmCustomDescriptionWithPolicy')}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<Button variant="secondary" size="sm" onClick={cancelLeave}>
						{t('common:cancel')}
					</Button>
					<Button size="sm" onClick={confirmLeave}>
						{t('settings.network.relay.confirmContinue')}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
