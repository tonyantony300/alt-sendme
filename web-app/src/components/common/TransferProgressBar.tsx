import { useTranslation } from '../../i18n/react-i18next-compat'
import type { TransferProgress } from '../../types/transfer'
import { formatETA } from '../../utils/etaUtils'

interface TransferProgressBarProps {
	progress: TransferProgress
}

export function formatSpeed(speedBps: number): string {
	const mbps = speedBps / (1024 * 1024)
	const kbps = speedBps / 1024
	if (mbps >= 1) {
		return `${mbps.toFixed(2)} MB/s`
	} else {
		return `${kbps.toFixed(2)} KB/s`
	}
}

// ─── Circular segmented ring (mobile only) ───────────────────────────────────
//
// 30 thin arc segments arranged clockwise from the top (12 o'clock).
// Each segment occupies (360 / 30) = 12° with a small gap between them.
// Fill logic mirrors the horizontal bar: full segments + one partial segment.

const SEGMENT_COUNT = 30
const SEGMENT_KEYS = Array.from(
	{ length: SEGMENT_COUNT },
	(_, i) => `segment-${i}`
)
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT // 12° per segment
const GAP_ANGLE = 2.2 // degrees of gap on each side
const ARC_ANGLE = SEGMENT_ANGLE - GAP_ANGLE * 2

const RING_SIZE = 200 // SVG viewBox size (px)
const CENTER = RING_SIZE / 2 // 100
const RADIUS = 84 // arc radius
const STROKE_WIDTH = 4.5 // thinner stroke for a sleeker look

/** Convert polar coordinates (angle from 12 o'clock, clockwise) to Cartesian. */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
	const angleRad = ((angleDeg - 90) * Math.PI) / 180
	return {
		x: cx + r * Math.cos(angleRad),
		y: cy + r * Math.sin(angleRad),
	}
}

/** Build an SVG arc path for a segment starting at `startAngle` spanning `sweep` degrees. */
function arcPath(startAngle: number, sweep: number): string {
	const start = polarToCartesian(CENTER, CENTER, RADIUS, startAngle)
	const end = polarToCartesian(CENTER, CENTER, RADIUS, startAngle + sweep)
	const largeArc = sweep > 180 ? 1 : 0
	return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

interface CircularRingProps {
	percentage: number
}

function CircularRing({ percentage }: CircularRingProps) {
	const { t } = useTranslation()
	const filledSegments = Math.floor((percentage / 100) * SEGMENT_COUNT)

	// How far into the current (partial) segment we are, as a 0–1 fraction
	const partialFraction = (percentage / 100) * SEGMENT_COUNT - filledSegments

	return (
		<svg
			viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
			width={RING_SIZE}
			height={RING_SIZE}
			role="progressbar"
			aria-label={t('common:transfer.progress')}
			aria-valuenow={Math.round(percentage)}
			aria-valuemin={0}
			aria-valuemax={100}
			className="mx-auto block"
		>
			{SEGMENT_KEYS.map((segmentKey, index) => {
				const segmentStartAngle = index * SEGMENT_ANGLE + GAP_ANGLE

				const isFilled = index < filledSegments
				const isPartial = index === filledSegments && partialFraction > 0

				// For the partial segment we shorten the visible arc proportionally
				const visibleSweep = isFilled
					? ARC_ANGLE
					: isPartial
						? ARC_ANGLE * partialFraction
						: 0

				return (
					<g key={segmentKey}>
						{/* Background (unfilled) arc */}
						<path
							d={arcPath(segmentStartAngle, ARC_ANGLE)}
							fill="none"
							stroke="var(--input)"
							strokeWidth={STROKE_WIDTH}
							strokeLinecap="round"
							className="transition-all duration-300 ease-in-out"
						/>
						{/* Filled arc (rendered on top) */}
						{visibleSweep > 0 && (
							<path
								d={arcPath(segmentStartAngle, visibleSweep)}
								fill="none"
								stroke="var(--app-primary)"
								strokeWidth={STROKE_WIDTH}
								strokeLinecap="round"
								className="transition-all duration-300 ease-in-out"
							/>
						)}
					</g>
				)
			})}
		</svg>
	)
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TransferProgressBar({ progress }: TransferProgressBarProps) {
	const { percentage } = progress
	const barCount = 30
	const { t } = useTranslation()
	const filledBars = Math.floor((percentage / 100) * barCount)

	return (
		<div className="space-y-3">
			{/* ── Mobile layout: circular ring ── */}
			<div className="sm:hidden flex flex-col items-center gap-3">
				<div className="relative inline-flex items-center justify-center">
					<CircularRing percentage={percentage} />

					{/* Labels centred inside the ring */}
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center pointer-events-none">
						<span className="text-2xl font-normal leading-none tabular-nums">
							{percentage.toFixed(1)}%
						</span>
						<span className="text-xs text-muted-foreground">
							{formatSpeed(progress.speedBps)}
						</span>
						<span className="text-xs text-muted-foreground tabular-nums">
							{(progress.bytesTransferred / (1024 * 1024)).toFixed(2)} /{' '}
							{(progress.totalBytes / (1024 * 1024)).toFixed(2)} MB
						</span>
						{progress.etaSeconds !== undefined && (
							<span className="text-xs text-muted-foreground">
								{t('common:transfer.eta')}: {formatETA(progress.etaSeconds)}
							</span>
						)}
					</div>
				</div>
			</div>

			{/* ── Desktop layout: horizontal segment bars ── */}
			<div className="hidden sm:block space-y-2">
				<div className="flex items-center justify-between text-xs">
					<span>{t('common:transfer.progress')}</span>
					<span>{percentage.toFixed(1)}%</span>
				</div>

				<div className="flex gap-1 items-end h-8">
					{Array.from({ length: barCount }).map((_, index) => {
						const isFilled = index < filledBars
						const isPartiallyFilled =
							index === filledBars && percentage % (100 / barCount) > 0

						let fillPercentage = 100
						if (isPartiallyFilled) {
							const barProgress =
								(percentage % (100 / barCount)) / (100 / barCount)
							fillPercentage = barProgress * 100
						} else if (!isFilled) {
							fillPercentage = 0
						}

						return (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: The values are always static so it is okay
								key={index}
								className="relative flex-1 rounded-sm bg-input transition-all duration-300 ease-in-out"
								style={{ minWidth: '3px', height: '100%' }}
							>
								<div
									className="absolute bottom-0 left-0 right-0 rounded-sm transition-all duration-300 ease-in-out"
									style={{
										backgroundColor: 'var(--app-primary)',
										height: `${fillPercentage}%`,
									}}
								/>
							</div>
						)
					})}
				</div>

				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>
						{t('common:transfer.speed')}: {formatSpeed(progress.speedBps)}
					</span>
					<span>
						{(progress.bytesTransferred / (1024 * 1024)).toFixed(2)} MB /{' '}
						{(progress.totalBytes / (1024 * 1024)).toFixed(2)} MB
					</span>
				</div>

				{progress.etaSeconds !== undefined && (
					<div className="flex items-center justify-start text-xs text-muted-foreground">
						<span className="mr-1">{t('common:transfer.eta')}:</span>
						<span>{formatETA(progress.etaSeconds)}</span>
					</div>
				)}
			</div>
		</div>
	)
}
