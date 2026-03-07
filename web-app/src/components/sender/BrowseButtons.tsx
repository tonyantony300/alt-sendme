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
		<Group className="mx-auto flex w-full max-w-sm flex-col gap-2 mt-2 sm:mt-0 sm:w-fit sm:max-w-none sm:flex-row sm:gap-0">
			<Button
				type="button"
				onClick={(e) => {
					e.stopPropagation()
					onBrowseFile()
				}}
				disabled={isLoading}
				className="rounded-none sm:rounded-lg"
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
			<GroupSeparator className="hidden sm:block" />
			<Button
				type="button"
				onClick={(e) => {
					e.stopPropagation()
					onBrowseFolder()
				}}
				disabled={isLoading}
				className="rounded-none sm:rounded-lg"
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
