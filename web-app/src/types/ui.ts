export interface AlertDialogState {
	isOpen: boolean
	title: string
	description: string
	type: 'success' | 'error' | 'info'
}

export type AlertType = 'success' | 'error' | 'info'

export type InstructionsCardProps = {}
