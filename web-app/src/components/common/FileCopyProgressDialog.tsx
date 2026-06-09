'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n/react-i18next-compat'

const MIN_DISPLAY_MS = 500

function formatBytes(bytes: number): string {
	if (bytes >= 1024 * 1024 * 1024) {
		const gb = bytes / (1024 * 1024 * 1024)
		return `${gb.toFixed(2)} GB`
	}
	const mb = bytes / (1024 * 1024)
	return `${mb.toFixed(1)} MB`
}

interface FileCopyProgressDialogProps {
	open: boolean
	fileName: string
	progress: number
	totalBytes: string
	onCancel: () => void
}

export function FileCopyProgressDialog({
	open,
	fileName,
	progress,
	totalBytes,
	onCancel,
}: FileCopyProgressDialogProps) {
	const { t } = useTranslation()
	const [visible, setVisible] = useState(false)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const total = Number.parseFloat(totalBytes) || 0
	const transferred = total * progress
	const percent = Number.isFinite(progress) ? Math.round(progress * 100) : 0

	useEffect(() => {
		if (open) {
			timerRef.current = setTimeout(() => {
				setVisible(true)
			}, MIN_DISPLAY_MS)
		} else {
			if (timerRef.current) {
				clearTimeout(timerRef.current)
				timerRef.current = null
			}
			setVisible(false)
		}

		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current)
				timerRef.current = null
			}
		}
	}, [open])

	if (!visible) return null

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/32 backdrop-blur-sm p-4">
			<div className="flex w-full max-w-sm flex-col gap-6 rounded-2xl border bg-popover p-6 shadow-lg">
				{fileName && (
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">
							{t('android.preparingFile')}
						</p>
						<p className="font-medium text-sm line-clamp-2">{fileName}</p>
					</div>
				)}

				<div className="space-y-2">
					<div className="h-3 w-full overflow-hidden rounded-full bg-input">
						<div
							className="h-full rounded-full bg-primary transition-all duration-150 ease-out"
							style={{ width: `${percent}%` }}
						/>
					</div>
					<div className="flex items-center justify-between text-xs tabular-nums">
						<span className="text-muted-foreground">
							{formatBytes(transferred)} / {formatBytes(total)}
						</span>
						<span className="font-medium">{percent}%</span>
					</div>
				</div>

				<Button
					variant="destructive"
					size="sm"
					onClick={onCancel}
					className="self-end"
				>
					{t('common:cancel')}
					<XIcon />
				</Button>
			</div>
		</div>,
		document.body
	)
}
