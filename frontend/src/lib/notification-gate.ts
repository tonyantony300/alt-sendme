/**
 * Whether an OS notification should be raised.
 *
 * Foreground suppression is the point: when the window has focus the in-app
 * dialog or toast already has the user's attention, and a banner on top of it
 * is noise.
 */
export function shouldNotify(input: {
	enabled: boolean
	foreground: boolean
}): boolean {
	return input.enabled && !input.foreground
}
