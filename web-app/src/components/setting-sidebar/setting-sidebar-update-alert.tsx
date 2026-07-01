import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useAppSettingStore } from '../../store/app-setting'
import {
	useCheckUpdateQuery,
	useInstallUpdateMutation,
} from '../../hooks/use-updater'
import { LazyIcon } from '../icons'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'

export function SettingSidebarUpdateAlert() {
	const { t } = useTranslation()
	const autoUpdate = useAppSettingStore((r) => r.autoUpdate)

	const updateVersion = useCheckUpdateQuery({ enabled: autoUpdate })
	const handleUpdate = useInstallUpdateMutation()

	if (updateVersion.isLoading || !updateVersion.data) {
		return null
	}

	return (
		<div className="px-2 mb-4">
			<Alert variant="success">
				<LazyIcon name="Info" />
				<AlertTitle>{t('updater.newUpdateTitle')}</AlertTitle>
				<AlertDescription>
					{t('updater.newVersionAvailable', {
						version: updateVersion.data?.version ?? '',
					})}
				</AlertDescription>
				<div className="col-span-full pt-2 flex-1 flex justify-end">
					<Button
						size="xs"
						variant="outline"
						onClick={() => handleUpdate.mutate()}
						disabled={handleUpdate.isPending}
					>
						{handleUpdate.isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							t('updater.updateNow')
						)}
					</Button>
				</div>
			</Alert>
		</div>
	)
}
