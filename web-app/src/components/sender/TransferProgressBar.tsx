import type { TransferProgress } from '../../types/sender'

interface TransferProgressBarProps {
  progress: TransferProgress
}

// Format speed in human-readable format
function formatSpeed(speedBps: number): string {
  const mbps = speedBps / (1024 * 1024)
  const kbps = speedBps / 1024

  if (mbps >= 1) {
    return `${mbps.toFixed(2)} MB/s`
  } else {
    return `${kbps.toFixed(2)} KB/s`
  }
}

export function TransferProgressBar({ progress }: TransferProgressBarProps) {
  const { percentage } = progress
  const barCount = 30
  
  // Calculate how many bars should be filled
  const filledBars = Math.floor((percentage / 100) * barCount)

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          <span>Transfer Progress</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
        
        {/* Progress bars container */}
        <div className="flex gap-1 items-end h-8">
          {Array.from({ length: barCount }).map((_, index) => {
            const isFilled = index < filledBars
            const isPartiallyFilled = index === filledBars && percentage % (100 / barCount) > 0
            
            // Calculate partial fill height for smoother animation
            let fillPercentage = 100
            if (isPartiallyFilled) {
              const barProgress = (percentage % (100 / barCount)) / (100 / barCount)
              fillPercentage = barProgress * 100
            } else if (!isFilled) {
              fillPercentage = 0
            }

            return (
              <div
                key={index}
                className="relative flex-1 rounded-sm transition-all duration-300 ease-in-out"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  minWidth: '3px',
                  height: '100%',
                }}
              >
                {/* Filled portion */}
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-sm transition-all duration-300 ease-in-out"
                  style={{
                    backgroundColor: 'rgba(37, 211, 101, 0.687)',
                    height: `${fillPercentage}%`,
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Speed display */}
        <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          <span>Speed: {formatSpeed(progress.speedBps)}</span>
          <span>
            {(progress.bytesTransferred / (1024 * 1024)).toFixed(2)} MB / {(progress.totalBytes / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>
      </div>
    </div>
  )
}

