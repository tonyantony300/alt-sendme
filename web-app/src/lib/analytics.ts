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

export function trackTransferComplete(fileSizeBytes: number): void {
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
    
    window.goatcounter.count({
      path: `transfer-complete/${bucketSize}`,
      title: `Transfer Complete - ${bucketSize}`,
      event: true,
      allow_local: true,
    })
  } catch (error) {
    // Silently fail
  }
}
