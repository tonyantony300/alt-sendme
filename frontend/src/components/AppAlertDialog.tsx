import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from './ui/dialog'
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
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose
						onClick={onClose}
						className={buttonVariants({ variant: 'default', size: 'sm' })}
					>
						{t('common:ok')}
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
