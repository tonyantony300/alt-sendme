import { useTranslation } from '@/i18n'

type VerificationCodeProps = {
	/** `null` when the endpoint id was malformed and no code could be derived. */
	code: string | null
	/** Who to compare against, phrased for this side of the exchange. */
	hint?: string
	/** Shown instead of the code when it could not be derived. */
	unavailable: string
}

/**
 * The shared verification-code block.
 *
 * Both sides of a first-contact exchange render this, showing the *same*
 * string derived independently from the sender's endpoint id — that identical
 * rendering is the whole mechanism, so the markup lives in one place rather
 * than being copied into each dialog where it could quietly drift apart.
 */
export function VerificationCode({
	code,
	hint,
	unavailable,
}: VerificationCodeProps) {
	const { t } = useTranslation()

	if (!code) {
		return <p className="text-xs text-destructive">{unavailable}</p>
	}

	return (
		<div className="space-y-1 rounded-md border bg-muted/30 px-3 py-2">
			<p className="text-xs font-medium text-muted-foreground">
				{t('common:receiver.nearbyInvite.fingerprintLabel')}
			</p>
			<p className="font-mono text-sm tracking-wide">{code}</p>
			{hint ? (
				<p className="text-xs text-muted-foreground">{hint}</p>
			) : null}
		</div>
	)
}
