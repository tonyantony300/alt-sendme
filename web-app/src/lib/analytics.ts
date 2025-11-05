declare global {
  interface Window {
    goatcounter?: {
      count: (options: {
        path?: string
        title?: string
        event?: boolean
        no_events?: boolean
        referrer?: string
        allow_local?: boolean
      }) => void
      allow_local?: boolean
    }
  }
}

export function trackTransferComplete(fileSizeBytes: number, role: 'sender' | 'receiver', durationMs: number = 0): void {
  if (typeof window === 'undefined' || !window.goatcounter) {
    return
  }
  
  try {
    const sizeInMB = fileSizeBytes / (1024 * 1024)
    let bucketSize: string
    
    if (fileSizeBytes === 0) {
      bucketSize = '0'
    } else if (sizeInMB < 1) {
      bucketSize = `${Math.round(fileSizeBytes / 1024)}KB`
    } else if (sizeInMB < 1024) {
      bucketSize = `${Math.round(sizeInMB)}MB`
    } else {
      bucketSize = `${(sizeInMB / 1024).toFixed(1)}GB`
    }
    
    let speedBucket = ''
    if (durationMs > 0) {
      const durationSeconds = durationMs / 1000
      const speedBytesPerSecond = fileSizeBytes / durationSeconds
      const speedMBps = speedBytesPerSecond / (1024 * 1024)
      
      if (speedMBps < 1) {
        const speedKBps = speedBytesPerSecond / 1024
        speedBucket = `${Math.round(speedKBps)}KBps`
      } else if (speedMBps < 1024) {
        speedBucket = `${Math.round(speedMBps)}MBps`
      } else {
        speedBucket = `${(speedMBps / 1024).toFixed(1)}GBps`
      }
    }
    
    const path = speedBucket 
      ? `transfer-complete/${role}/${bucketSize}/${speedBucket}`
      : `transfer-complete/${role}/${bucketSize}`
    
    window.goatcounter.count({
      path,
      allow_local: true,
    })
  } catch (error) {
  }
}
