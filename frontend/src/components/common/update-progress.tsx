import {
	Progress,
	ProgressTrack,
	ProgressIndicator,
} from '@/components/ui/progress'
import { formatFileSize } from '@/lib/utils'

/**
 * Determinate while the updater has reported a content length, indeterminate
 * otherwise (`Started` may arrive without one) — never a bare spinner.
 */
export function UpdateProgressBar({
	downloadedBytes,
	contentLength,
	progressRatio,
}: {
	downloadedBytes: number
	contentLength: number | null
	progressRatio: number | null
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<Progress
				value={progressRatio === null ? null : progressRatio * 100}
				className="gap-0"
			>
				<ProgressTrack>
					<ProgressIndicator />
				</ProgressTrack>
			</Progress>
			{contentLength !== null && (
				<p className="text-muted-foreground text-xs tabular-nums">
					{formatFileSize(downloadedBytes, { precision: 1 })} /{' '}
					{formatFileSize(contentLength, { precision: 1 })}
				</p>
			)}
		</div>
	)
}
