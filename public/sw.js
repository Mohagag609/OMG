/**
 * Service Worker for Estate Management App
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'estate-management-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

// FIXED: Cache strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: 'cache-first',
  // Network first for API calls
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate for dynamic content
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// FIXED: Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/customers',
  '/units',
  '/contracts',
  '/partners',
  '/treasury',
  '/reports',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// FIXED: API routes to cache
const API_ROUTES = [
  '/api/dashboard',
  '/api/customers',
  '/api/units',
  '/api/contracts',
  '/api/partners'
]

// FIXED: Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets...')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('Failed to cache static assets:', error)
      })
  )
})

// FIXED: Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE
            )
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
  )
})

// FIXED: Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(handleStaticAsset(request))
    return
  }

  // Handle page requests
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handlePageRequest(request))
    return
  }

  // Default: try cache first, then network
  event.respondWith(handleDefaultRequest(request))
})

// FIXED: Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('Network failed, trying cache:', error)
    
    // Fallback to cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page for API requests
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'لا يوجد اتصال بالإنترنت',
        offline: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// FIXED: Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Failed to fetch static asset:', error)
    throw error
  }
}

// FIXED: Handle page requests
async function handlePageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline page
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>لا يوجد اتصال - مدير الاستثمار العقاري</title>
        <style>
          body { 
            font-family: 'Cairo', Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f3f4f6; 
            text-align: center; 
          }
          .container { 
            max-width: 500px; 
            margin: 50px auto; 
            background: white; 
            padding: 40px; 
            border-radius: 20px; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
          }
          .icon { font-size: 4rem; margin-bottom: 20px; }
          h1 { color: #374151; margin-bottom: 20px; }
          p { color: #6b7280; margin-bottom: 30px; }
          button { 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 10px; 
            cursor: pointer; 
            font-size: 16px; 
          }
          button:hover { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📡</div>
          <h1>لا يوجد اتصال بالإنترنت</h1>
          <p>يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى</p>
          <button onclick="window.location.reload()">🔄 إعادة المحاولة</button>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

// FIXED: Handle default requests
async function handleDefaultRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Failed to fetch resource:', error)
    throw error
  }
}

// FIXED: Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered')
    event.waitUntil(handleBackgroundSync())
  }
})

async function handleBackgroundSync() {
  try {
    // Handle any pending offline actions
    console.log('Processing background sync...')
    
    // You can add logic here to sync offline data
    // when the connection is restored
    
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// FIXED: Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || 'إشعار جديد من مدير الاستثمار العقاري',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'فتح التطبيق',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/icons/icon-192x192.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'إشعار جديد', options)
  )
})

// FIXED: Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

console.log('Service Worker loaded successfully')