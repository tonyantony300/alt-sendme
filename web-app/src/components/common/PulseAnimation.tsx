import LottieDefault from 'lottie-react'
import pulseAnimationOriginal from '../../assets/pulse.json'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

// handle both default and named exports for Lottie
const Lottie = (LottieDefault as any).default || LottieDefault

interface PulseAnimationProps {
	isTransporting: boolean
	hasActiveConnections?: boolean
	className?: string
}

function modifyAnimationColor(animationData: any, color: number[]) {
	// if Vite inlines the JSON, then parse it
	const data = animationData?.default || animationData
	if (!data) return null

	const cloned = JSON.parse(JSON.stringify(data))

	if (cloned.assets?.[0]?.layers) {
		cloned.assets[0].layers.forEach((layer: any) => {
			if (layer.shapes) {
				layer.shapes.forEach((shape: any) => {
					if (shape.it) {
						shape.it.forEach((item: any) => {
							if (item.ty === 'fl' && item.c && item.c.k) {
								item.c.k = color
							}
						})
					}
				})
			}
		})
	}

	return cloned
}

export function PulseAnimation({
	isTransporting,
	hasActiveConnections = false,
	className = '',
}: PulseAnimationProps) {
	const animationData = useMemo(() => {
		let color: number[]

		if (isTransporting || hasActiveConnections) {
			// Active transfer or active connections: green
			color = [37 / 255, 211 / 255, 101 / 255, 0.687]
		} else {
			// Waiting/idle: gray
			color = [183 / 255, 183 / 255, 183 / 255, 1]
		}

		return modifyAnimationColor(pulseAnimationOriginal, color)
	}, [isTransporting, hasActiveConnections])

	return (
		<div className={cn(className, isTransporting && 'max-sm:hidden')}>
			{animationData && Lottie && (
				<Lottie
					animationData={animationData}
					loop={true}
					autoplay={true}
					style={{ width: 180, height: 180 }}
				/>
			)}
		</div>
	)
}
