import Lottie from 'lottie-react'
import pulseAnimationOriginal from '../../assets/pulse.json'
import { useMemo } from 'react'

interface PulseAnimationProps {
  isTransporting: boolean
  isCompleted?: boolean
  className?: string
}

// Helper function to deep clone and modify the animation data
function modifyAnimationColor(animationData: any, color: number[]) {
  // Deep clone the animation data
  const cloned = JSON.parse(JSON.stringify(animationData))
  
  // Navigate through the structure to find and update fill colors
  // The structure is: assets[0].layers[].shapes[].it[].c.k
  if (cloned.assets && cloned.assets[0] && cloned.assets[0].layers) {
    cloned.assets[0].layers.forEach((layer: any) => {
      if (layer.shapes) {
        layer.shapes.forEach((shape: any) => {
          if (shape.it) {
            shape.it.forEach((item: any) => {
              // Look for fill items (ty: "fl")
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
  // Modify the animation data based on the transporting/completed state
  const animationData = useMemo(() => {
    let color: number[]
    
    if (isCompleted) {
      // Blue color when completed
      color = [45/255, 120/255, 220/255, 1] // rgb(45, 120, 220)
    } else if (isTransporting) {
      // Green color when transporting
      color = [37/255, 211/255, 101/255, 0.687] // rgba(37, 211, 101, 0.687)
    } else {
      // Gray color when listening
      color = [183/255, 183/255, 183/255, 1] // #B7B7B7
    }
    
    return modifyAnimationColor(pulseAnimationOriginal, color)
  }, [isTransporting, isCompleted])

  return (
    <div className={className}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: 256, height: 256 }}
      />
    </div>
  )
}

