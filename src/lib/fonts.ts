/**
 * Font Optimization and Loading Utilities
 */

// FIXED: Font loading configuration
export interface FontConfig {
  family: string
  weights: number[]
  styles: ('normal' | 'italic')[]
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
  preload?: boolean
  fallback?: string[]
}

// FIXED: Font configurations
export const fontConfigs: FontConfig[] = [
  {
    family: 'Cairo',
    weights: [300, 400, 500, 600, 700, 800, 900],
    styles: ['normal'],
    display: 'swap',
    preload: true,
    fallback: ['Arial', 'sans-serif']
  },
  {
    family: 'Inter',
    weights: [300, 400, 500, 600, 700],
    styles: ['normal'],
    display: 'swap',
    preload: true,
    fallback: ['system-ui', 'sans-serif']
  }
]

// FIXED: Generate font preload links
export function generateFontPreloadLinks(): string {
  return fontConfigs
    .filter(config => config.preload)
    .map(config => {
    const weights = config.weights.join(';')
    const url = `https://fonts.googleapis.com/css2?family=${config.family}:wght@${weights}&display=${config.display}`
      
      return `<link rel="preload" href="${url}" as="style" onload="this.onload=null;this.rel='stylesheet'">`
    })
    .join('\n')
}

// FIXED: Font loading detection
export function isFontLoaded(fontFamily: string): Promise<boolean> {
  if (typeof document === 'undefined') {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    // Check if font is already loaded
    if (document.fonts && document.fonts.check) {
      const isLoaded = document.fonts.check(`16px ${fontFamily}`)
      if (isLoaded) {
        resolve(true)
        return
      }
    }

    // Fallback: check if font is available
    const testString = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const testSize = '72px'
    const fallbackFont = 'monospace'
    
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    if (!context) {
      resolve(false)
      return
    }

    // Measure fallback font
    context.font = `${testSize} ${fallbackFont}`
    const fallbackWidth = context.measureText(testString).width

    // Measure target font
    context.font = `${testSize} ${fontFamily}, ${fallbackFont}`
    const targetWidth = context.measureText(testString).width

    // If widths are different, font is loaded
    resolve(Math.abs(targetWidth - fallbackWidth) > 1)
  })
}

// FIXED: Font loading with timeout
export async function loadFontWithTimeout(
  fontFamily: string,
  timeout: number = 3000
): Promise<boolean> {
  try {
    const isLoaded = await Promise.race([
      isFontLoaded(fontFamily),
      new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Font loading timeout')), timeout)
      )
    ])
    
    return isLoaded
  } catch (error) {
    console.warn(`Font ${fontFamily} failed to load within ${timeout}ms:`, error)
    return false
  }
}

// FIXED: Font loading hook
export function useFontLoading(fontFamily: string) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadFont = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const loaded = await loadFontWithTimeout(fontFamily, 5000)
        
        if (isMounted) {
          setIsLoaded(loaded)
          setIsLoading(false)
          
          if (!loaded) {
            setError(`Failed to load font: ${fontFamily}`)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setIsLoading(false)
        }
      }
    }

    loadFont()

    return () => {
      isMounted = false
    }
  }, [fontFamily])

  return { isLoaded, isLoading, error }
}

// FIXED: Font fallback CSS
export function generateFontFallbackCSS(): string {
  return fontConfigs
    .map(config => {
      const fallback = config.fallback?.join(', ') || 'sans-serif'
      return `
        .font-${config.family.toLowerCase().replace(/\s+/g, '-')} {
          font-family: '${config.family}', ${fallback};
          font-display: ${config.display};
        }
      `
    })
    .join('\n')
}

// FIXED: Critical font loading
export async function loadCriticalFonts(): Promise<void> {
  if (typeof window === 'undefined') return

  const criticalFonts = fontConfigs.filter(config => config.preload)
  
  try {
    await Promise.all(
      criticalFonts.map(config => loadFontWithTimeout(config.family, 2000))
    )
  } catch (error) {
    console.warn('Some critical fonts failed to load:', error)
  }
}

// FIXED: Font performance monitoring
export function monitorFontPerformance(): void {
  if (typeof window === 'undefined' || !('performance' in window)) return

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes('font')) {
        console.log(`Font loaded: ${entry.name} in ${entry.duration}ms`)
      }
    }
  })

  try {
    observer.observe({ entryTypes: ['resource'] })
  } catch (error) {
    console.warn('Font performance monitoring not supported:', error)
  }
}

// FIXED: Font loading optimization
export function optimizeFontLoading(): void {
  if (typeof window === 'undefined') return

  // Preload critical fonts
  loadCriticalFonts()

  // Monitor font performance
  monitorFontPerformance()

  // Add font loading event listeners
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      console.log('All fonts loaded successfully')
    })
  }
}

// FIXED: Import React hooks
import { useState, useEffect } from 'react'