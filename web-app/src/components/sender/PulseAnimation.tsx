import Lottie from 'lottie-react'
import pulseAnimationOriginal from '../../assets/pulse.json'
import { useMemo } from 'react'

interface PulseAnimationProps {
  isTransporting: boolean
  isCompleted?: boolean
  className?: string
}

function modifyAnimationColor(animationData: any, color: number[]) {
  const cloned = JSON.parse(JSON.stringify(animationData))
  
  if (cloned.assets && cloned.assets[0] && cloned.assets[0].layers) {
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

export function PulseAnimation({ isTransporting, isCompleted = false, className = '' }: PulseAnimationProps) {
  const animationData = useMemo(() => {
    let color: number[]
    
    if (isCompleted) {
      color = [45/255, 120/255, 220/255, 1]
    } else if (isTransporting) {
      color = [37/255, 211/255, 101/255, 0.687]
    } else {
      color = [183/255, 183/255, 183/255, 1]
    }
    
    return modifyAnimationColor(pulseAnimationOriginal, color)
  }, [isTransporting, isCompleted])

  return (
    <div className={className}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: 180, height: 180 }}
      />
    </div>
  )
}

