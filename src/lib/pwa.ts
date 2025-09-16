/**
 * Progressive Web App (PWA) Utilities
 */

// FIXED: PWA configuration and utilities
export interface PWAConfig {
  name: string
  shortName: string
  description: string
  themeColor: string
  backgroundColor: string
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  orientation: 'portrait' | 'landscape' | 'any'
  startUrl: string
  scope: string
  icons: Array<{
    src: string
    sizes: string
    type: string
    purpose?: 'any' | 'maskable'
  }>
}

// FIXED: Default PWA configuration
export const defaultPWAConfig: PWAConfig = {
  name: 'مدير الاستثمار العقاري',
  shortName: 'مدير العقارات',
  description: 'تطبيق شامل لإدارة الاستثمارات العقارية مع نظام مراقبة ونسخ احتياطية',
  themeColor: '#3b82f6',
  backgroundColor: '#ffffff',
  display: 'standalone',
  orientation: 'portrait',
  startUrl: '/',
  scope: '/',
  icons: [
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/icon-maskable-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable'
    },
    {
      src: '/icons/icon-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    }
  ]
}

// FIXED: PWA installation detection
export function isPWAInstallable(): boolean {
  if (typeof window === 'undefined') return false
  
  return 'serviceWorker' in navigator && 
         'PushManager' in window &&
         'Notification' in window
}

// FIXED: PWA installation prompt
export function showInstallPrompt(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isPWAInstallable()) {
      resolve(false)
      return
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      resolve(false)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      
      // Show custom install prompt
      const shouldInstall = confirm(
        'هل تريد تثبيت هذا التطبيق على جهازك للوصول السريع؟'
      )
      
      if (shouldInstall) {
        // Trigger the install prompt
        ;(e as any).prompt()
        ;(e as any).userChoice.then((choiceResult: any) => {
          resolve(choiceResult.outcome === 'accepted')
        })
      } else {
        resolve(false)
      }
      
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // Timeout after 10 seconds
    setTimeout(() => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      resolve(false)
    }, 10000)
  })
}

// FIXED: Service Worker registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    
    console.log('Service Worker registered successfully:', registration)
    
    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available
            if (confirm('يوجد تحديث جديد متاح. هل تريد تحديث الصفحة؟')) {
              window.location.reload()
            }
          }
        })
      }
    })
    
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

// FIXED: Push notification support
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  const permission = await Notification.requestPermission()
  return permission
}

// FIXED: Show notification
export function showNotification(
  title: string,
  options: NotificationOptions = {}
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      ...options
    })
  }
}

// FIXED: Offline detection
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

// FIXED: Online/offline event listeners
export function addOnlineListener(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  window.addEventListener('online', callback)
  return () => window.removeEventListener('online', callback)
}

export function addOfflineListener(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  window.addEventListener('offline', callback)
  return () => window.removeEventListener('offline', callback)
}

// FIXED: Cache management
export async function clearCache(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  try {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    )
    console.log('Cache cleared successfully')
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}

// FIXED: Storage quota management
export async function getStorageQuota(): Promise<{
  quota: number
  usage: number
  available: number
  percentage: number
} | null> {
  if (typeof window === 'undefined' || !('storage' in navigator)) {
    return null
  }

  try {
    const estimate = await navigator.storage.estimate()
    const quota = estimate.quota || 0
    const usage = estimate.usage || 0
    const available = quota - usage
    const percentage = quota > 0 ? (usage / quota) * 100 : 0

    return {
      quota,
      usage,
      available,
      percentage
    }
  } catch (error) {
    console.error('Failed to get storage quota:', error)
    return null
  }
}

// FIXED: PWA initialization
export async function initializePWA(config: PWAConfig = defaultPWAConfig): Promise<{
  isInstalled: boolean
  isOnline: boolean
  hasNotificationPermission: boolean
  serviceWorker: ServiceWorkerRegistration | null
}> {
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches
  const isOnlineStatus = isOnline()
  const hasNotificationPermission = Notification.permission === 'granted'
  const serviceWorker = await registerServiceWorker()

  return {
    isInstalled,
    isOnline: isOnlineStatus,
    hasNotificationPermission,
    serviceWorker
  }
}

// FIXED: PWA status hook
export function usePWAStatus() {
  const [status, setStatus] = useState({
    isInstalled: false,
    isOnline: true,
    hasNotificationPermission: false,
    serviceWorker: null as ServiceWorkerRegistration | null
  })

  useEffect(() => {
    const initialize = async () => {
      const pwaStatus = await initializePWA()
      setStatus(pwaStatus)
    }

    initialize()

    // Listen for online/offline changes
    const removeOnlineListener = addOnlineListener(() => {
      setStatus(prev => ({ ...prev, isOnline: true }))
    })

    const removeOfflineListener = addOfflineListener(() => {
      setStatus(prev => ({ ...prev, isOnline: false }))
    })

    return () => {
      removeOnlineListener()
      removeOfflineListener()
    }
  }, [])

  return status
}

// FIXED: Import React hooks
import { useState, useEffect } from 'react'