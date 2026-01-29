import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogClose,
} from './ui/alert-dialog'
import type { AlertType } from '../types/ui'
import { useTranslation } from '@/i18n'
import { buttonVariants } from './ui/button'

interface AppAlertDialogProps {
	isOpen: boolean
	title: string
	description: string
	type?: AlertType
	onClose: () => void
}

export function AppAlertDialog({
	isOpen,
	title,
	description,
	onClose,
}: AppAlertDialogProps) {
	const { t } = useTranslation()
	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogClose
						onClick={onClose}
						className={buttonVariants({ variant: 'default', size: 'sm' })}
					>
						{t('common:close')}
					</AlertDialogClose>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
