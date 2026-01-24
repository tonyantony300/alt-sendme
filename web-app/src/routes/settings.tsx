import { SingleLayoutPage } from '@/components/common/SingleLayoutPage'
import { buttonVariants } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SettingsPage() {
	return (
		<SingleLayoutPage>
			<Link className={buttonVariants({ className: 'max-w-24' })} to="/">
				<ChevronLeft />
				Go back
			</Link>
		</SingleLayoutPage>
	)
}
