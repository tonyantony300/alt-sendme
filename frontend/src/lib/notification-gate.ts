/**
 * Whether an OS notification should be raised. Suppressed in the foreground,
 * where the in-app dialog or toast already has the user's attention.
 */
export function shouldNotify(input: {
	enabled: boolean
	foreground: boolean
}): boolean {
	return input.enabled && !input.foreground
}
