import { useState } from 'react'
import { useTranslation } from '../../../i18n'
import { clearTransferHistory } from '../../../lib/transfer-history-api'
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
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from '../../ui/frame'
import { Switch } from '../../ui/switch'
import { toastManager } from '../../ui/toast'

export function TransferHistorySettings() {
	const { t } = useTranslation()
	const enabled = useAppSettingStore((state) => state.enableTransferHistory)
	const setEnabled = useAppSettingStore(
		(state) => state.setEnableTransferHistory
	)
	const [confirmClear, setConfirmClear] = useState(false)
	const [isClearing, setIsClearing] = useState(false)

	const handleClear = async () => {
		setIsClearing(true)
		try {
			await clearTransferHistory()
			setConfirmClear(false)
			toastManager.add({
				title: t('common:history.clearAllDone'),
				type: 'success',
			})
		} catch (error) {
			console.error(error)
			toastManager.add({
				title: t('common:history.clearAllFailed'),
				type: 'error',
			})
		} finally {
			setIsClearing(false)
		}
	}

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{t('common:history.settings.title')}</FrameTitle>
			</FrameHeader>
			<FramePanel className="space-y-4">
				<div className="flex items-center justify-between gap-4">
					<div className="flex-1">
						<FrameTitle>{t('common:history.settings.toggle')}</FrameTitle>
						<FrameDescription>
							{t('common:history.settings.toggleHint')}
						</FrameDescription>
					</div>
					<Switch checked={enabled} onCheckedChange={setEnabled} />
				</div>

				{/* Separate from the toggle: turning recording off is not deleting. */}
				<div className="flex items-center justify-between gap-4 border-t pt-4">
					<div className="flex-1">
						<FrameTitle>{t('common:history.clearAll')}</FrameTitle>
						<FrameDescription>
							{t('common:history.settings.description')}
						</FrameDescription>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setConfirmClear(true)}
					>
						{t('common:history.clearAll')}
					</Button>
				</div>
			</FramePanel>

			<AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t('common:history.clearAllConfirmTitle')}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t('common:history.clearAllConfirmBody')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmClear(false)}
							disabled={isClearing}
						>
							{t('common:cancel')}
						</Button>
						<Button
							variant="destructive"
							onClick={handleClear}
							disabled={isClearing}
						>
							{t('common:history.clearAll')}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Frame>
	)
}
