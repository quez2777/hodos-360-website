// Service Worker for HODOS 360
const CACHE_NAME = 'hodos-360-v1';
const RUNTIME_CACHE = 'hodos-runtime-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/about',
  '/products',
  '/pricing',
  '/contact',
  '/offline.html', // We'll create this fallback page
  '/_next/static/css/*.css',
  '/_next/static/js/*.js',
  '/fonts/*.woff2',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first - for static assets
  cacheFirst: async (request) => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return new Response('Offline', { status: 503 });
    }
  },
  
  // Network first - for API calls and dynamic content
  networkFirst: async (request) => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      return cached || new Response('Offline', { status: 503 });
    }
  },
  
  // Stale while revalidate - for images and less critical resources
  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    });
    
    return cached || fetchPromise;
  },
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache pages and critical assets
      return cache.addAll([
        '/',
        '/about',
        '/products',
        '/pricing',
        '/contact',
      ]).catch((error) => {
        console.error('Failed to cache static assets:', error);
      });
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip Chrome extensions and non-http(s) requests
  if (!url.protocol.startsWith('http')) return;
  
  // API routes - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }
  
  // Static assets - cache first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  ) {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
    return;
  }
  
  // Images - stale while revalidate
  if (
    url.pathname.startsWith('/_next/image') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request));
    return;
  }
  
  // HTML pages - network first with offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      CACHE_STRATEGIES.networkFirst(request).catch(() => {
        return caches.match('/offline.html') || new Response('Offline', { status: 503 });
      })
    );
    return;
  }
  
  // Default - stale while revalidate
  event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request));
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncFormData());
  }
});

async function syncFormData() {
  // Implement background sync for form submissions
  // This would sync any offline form submissions when back online
  console.log('Syncing offline form data...');
}