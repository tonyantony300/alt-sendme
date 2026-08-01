export type NotificationKind =
	| 'pair-request'
	| 'invite-paired'
	| 'invite-nearby'
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

function name(value: unknown, t: Translate): string {
	return typeof value === 'string' && value.trim()
		? value.trim()
		: t(UNKNOWN_PEER)
}

/**
 * Turns a pairing/invite event payload into notification copy.
 *
 * Pure by design: zero imports — `t` and `formatSize` are injected — so the
 * routing and string assembly can be unit tested under `pnpm test:lib`,
 * which is where the mistakes in this feature will actually be.
 *
 * Returns `null` for payloads that cannot be read, so callers can skip the
 * notification rather than showing a half-built one.
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
