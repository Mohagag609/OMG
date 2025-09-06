const CACHE_NAME = 'estate-pro-cache-v2'; // Start with v2 to be safe
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/db.js',
    '/style.css',
    '/manifest.json',
    'https://unpkg.com/htmx.org@1.9.10',
    'https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.js',
    'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.wasm'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache and caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response; // Serve from cache
                }
                return fetch(event.request); // Fetch from network
            }
        )
    );
});
