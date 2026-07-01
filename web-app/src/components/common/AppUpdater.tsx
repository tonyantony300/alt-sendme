import { useEffect, useState } from 'react'
import { Loader2, Gift } from 'lucide-react'
import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n'
import { useAppSettingStore } from '@/store/app-setting'
import {
	useCheckUpdateQuery,
	useInstallUpdateMutation,
} from '@/hooks/use-updater'
import { toastManager } from '../ui/toast'

export function AppUpdater() {
	const [isOpen, setIsOpen] = useState(false)
	const [newVersion, setNewVersion] = useState<string>('')
	const { t } = useTranslation()
	const autoUpdate = useAppSettingStore((state) => state.autoUpdate)
	const { data: updateData } = useCheckUpdateQuery({
		enabled: autoUpdate,
	})
	const installUpdateMutation = useInstallUpdateMutation()

	useEffect(() => {
		if (autoUpdate && updateData) {
			setNewVersion(updateData.version)
			setIsOpen(true)
		}
	}, [autoUpdate, updateData])

	const handleUpdate = () => {
		installUpdateMutation
			.mutateAsync()
			.then(() => {
				// Optionally, you can show a success message here
				setIsOpen(false)
			})
			.catch((error) => {
				// Optionally, handle errors here
				console.error('Failed to install update:', error)
				toastManager.add({
					title: t('updater.installFailed'),
					description: t('updater.installFailedDesc'),
					type: 'error',
				})
			})
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogContent
				backdropClassName="!bg-transparent !backdrop-blur-none"
				className="fixed bottom-1 left-2 translate-x-0 translate-y-0 w-md"
			>
				<div className="flex px-5 py-4 items-center gap-2">
					<Gift className="w-4 h-4 text-muted-foreground" />
					<p className="text-sm flex items-center text-muted-foreground">
						{t('updater.newVersionAvailableInline', {
							version: newVersion,
						})}
					</p>
					<div className="flex gap-2 ml-auto">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsOpen(false)}
						>
							{t('updater.later')}
						</Button>
						<Button
							size="sm"
							className="w-24"
							onClick={handleUpdate}
							disabled={installUpdateMutation.isPending}
							aria-busy={installUpdateMutation.isPending}
						>
							{installUpdateMutation.isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								t('updater.updateNow')
							)}
						</Button>
					</div>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	)
}
