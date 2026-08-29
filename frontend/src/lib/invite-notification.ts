export type NotificationKind =
	| 'pair-request'
	| 'invite-paired'
	| 'invite-nearby'
	| 'invite-auto-accepted'
	| 'invite-declined'
	| 'device-paired'

export type NotificationContent = { title: string; body: string }

export type Translate = (
	key: string,
	options?: Record<string, unknown>
) => string

export type NotificationDeps = {
	t: Translate
	formatSize: (bytes: number) => string
}

const UNKNOWN_PEER = 'common:sender.pairedDevices.unknownPeer'

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

/**
 * Longest peer name allowed into notification copy. The name is chosen by the
 * remote device, and only the "nearby" qualifier after it separates a
 * stranger's banner from a trusted device's — a long name would push that past
 * the OS truncation point.
 */
export const MAX_PEER_NAME_LENGTH = 40

function name(value: unknown, t: Translate): string {
	if (typeof value !== 'string' || !value.trim()) return t(UNKNOWN_PEER)
	const trimmed = value.trim()
	return trimmed.length > MAX_PEER_NAME_LENGTH
		? `${trimmed.slice(0, MAX_PEER_NAME_LENGTH - 1)}…`
		: trimmed
}

/**
 * Turns a pairing/invite event payload into notification copy. Pure by design
 * — `t` and `formatSize` are injected, so routing and string assembly are
 * testable under `pnpm test:lib`.
 *
 * `null` for unreadable payloads, so callers skip rather than show a half-built
 * notification.
 */
export function buildInviteNotification(
	kind: NotificationKind,
	payload: unknown,
	{ t, formatSize }: NotificationDeps
): NotificationContent | null {
	if (!isRecord(payload)) return null

	switch (kind) {
		case 'pair-request':
			return {
				title: t('common:notifications.pairRequestTitle', {
					sender: name(payload.sender_name, t),
				}),
				body: t('common:notifications.pairRequestBody'),
			}

		case 'invite-paired':
		case 'invite-nearby': {
			const count = Number(payload.file_count) || 0
			const size = Number(payload.total_size) || 0
			const titleKey =
				kind === 'invite-nearby'
					? 'common:notifications.nearbyInviteTitle'
					: 'common:notifications.inviteTitle'
			return {
				title: t(titleKey, { sender: name(payload.sender_name, t) }),
				body:
					size > 0
						? t('common:notifications.inviteBody', {
								count,
								size: formatSize(size),
							})
						: t('common:notifications.inviteBodyNoSize', { count }),
			}
		}

		case 'invite-auto-accepted': {
			const count = Number(payload.file_count) || 0
			const size = Number(payload.total_size) || 0
			return {
				title: t('common:notifications.autoAcceptTitle', {
					sender: name(payload.sender_name, t),
				}),
				body:
					size > 0
						? t('common:notifications.autoAcceptBody', {
								count,
								size: formatSize(size),
							})
						: t('common:notifications.autoAcceptBodyNoSize', { count }),
			}
		}

		case 'invite-declined':
			return {
				title: t('common:notifications.declinedTitle', {
					sender: name(payload.display_name, t),
				}),
				body: t('common:notifications.declinedBody'),
			}

		case 'device-paired':
			return {
				title: t('common:notifications.pairedTitle'),
				body: t('common:notifications.pairedBody', {
					name: name(payload.display_name, t),
				}),
			}
	}
}
