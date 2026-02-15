import { useNavigate } from 'react-router-dom'
import { SingleLayoutPage } from '../components/common/SingleLayoutPage'
import { Button } from '../components/ui/button'
import { LazyIcon } from '../components/icons'
import { useTranslation } from '../i18n'

export function NotFoundPage() {
	const navigate = useNavigate()
	const { t } = useTranslation()

	const handleGoBack = () => {
		navigate(-1)
	}

	const handleGoHome = () => {
		navigate('/')
	}

	return (
		<SingleLayoutPage className="space-y-8 items-center justify-center">
			<div className="space-y-4 text-center max-w-md">
				<div className="mb-8">
					<h1 className="text-7xl font-bold text-muted-foreground/30 select-none">
						404
					</h1>
				</div>
				<h2 className="text-3xl font-semibold tracking-tight">
					{t('notFound.title')}
				</h2>
				<p className="text-muted-foreground text-lg leading-relaxed">
					{t('notFound.subtitle')}
				</p>
			</div>
			<div className="flex gap-3 items-center justify-center flex-wrap">
				<Button variant="secondary" onClick={handleGoBack} className="gap-2">
					<LazyIcon name="ArrowLeft" />
					{t('notFound.goBack')}
				</Button>
				<Button onClick={handleGoHome} className="gap-2">
					<LazyIcon weight="fill" name="House" />
					{t('notFound.goHome')}
				</Button>
			</div>
		</SingleLayoutPage>
	)
}
