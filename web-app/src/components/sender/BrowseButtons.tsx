import { FileTextIcon, FolderOpenIcon } from 'lucide-react'
import { useTranslation } from '../../i18n/react-i18next-compat'
import type { BrowseButtonsProps } from '../../types/sender'
import { Button } from '../ui/button'
import { Group, GroupSeparator } from '../ui/group'

export function BrowseButtons({
	isLoading,
	onBrowseFile,
	onBrowseFolder,
}: BrowseButtonsProps) {
	const { t } = useTranslation()

	return (
		<Group className="mx-auto">
			<Button
				type="button"
				onClick={(e) => {
					e.stopPropagation()
					onBrowseFile()
				}}
				disabled={isLoading}
			>
				{isLoading ? (
					t('common:loading')
				) : (
					<>
						{t('common:sender.browseFile')}
						<FileTextIcon />
					</>
				)}
			</Button>
			<GroupSeparator />
			<Button
				type="button"
				onClick={(e) => {
					e.stopPropagation()
					onBrowseFolder()
				}}
				disabled={isLoading}
			>
				{isLoading ? (
					t('common:loading')
				) : (
					<>
						{t('common:sender.browseFolder')}
						<FolderOpenIcon />
					</>
				)}
			</Button>
		</Group>
	)
}
