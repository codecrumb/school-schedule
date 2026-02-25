// Service Worker for School Schedule Calendar PWA
// Version: 1.0.2 - Security update (corrected postMessage validation)
const CACHE_VERSION = 'v1.0.2';
const CACHE_NAME = `school-schedule-${CACHE_VERSION}`;
const CACHE_NAME_DYNAMIC = `school-schedule-dynamic-${CACHE_VERSION}`;

// Files to pre-cache (the app shell)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/translations.js',
  '/favicon.ico',
  '/apple-touch-icon.png',
  // External CDN resources (cached separately)
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'
];

// Dynamic cache patterns (API calls, fonts, etc.)
const DYNAMIC_CACHE_PATTERNS = [
  /\/functions\/api\/events/,
  /fonts\.gstatic\.com/,
  /\.woff2$/,
  /\.woff$/
];

// Cache size limits
const MAX_DYNAMIC_CACHE_SIZE = 50;

// Helper: Limit cache size
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
}

// Install event - pre-cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Pre-cache complete');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Pre-cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...', CACHE_VERSION);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versions
              return cacheName.startsWith('school-schedule-') &&
                     cacheName !== CACHE_NAME &&
                     cacheName !== CACHE_NAME_DYNAMIC;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - cache-first strategy with background update
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests that aren't CDN resources or fonts
  if (url.origin !== location.origin &&
      !url.href.includes('cdn.tailwindcss.com') &&
      !url.href.includes('fonts.googleapis.com') &&
      !url.href.includes('fonts.gstatic.com')) {
    return;
  }

  // API requests - Cache first, then network with background update
  if (url.pathname.includes('/functions/api/events')) {
    event.respondWith(
      handleAPIRequest(request)
    );
    return;
  }

  // All other requests - Cache first, fallback to network
  event.respondWith(
    handleCacheFirst(request)
  );
});

// Cache-first strategy with background update
async function handleCacheFirst(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // Found in cache - return immediately
      // But also fetch in background to update cache
      updateCacheInBackground(request);
      return cachedResponse;
    }

    // Not in cache - fetch from network
    const networkResponse = await fetch(request);

    // Cache the response for next time
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();

      // Determine which cache to use
      const isDynamic = DYNAMIC_CACHE_PATTERNS.some(pattern =>
        pattern.test(request.url)
      );
      const cacheName = isDynamic ? CACHE_NAME_DYNAMIC : CACHE_NAME;

      caches.open(cacheName).then((cache) => {
        cache.put(request, responseToCache);

        // Trim dynamic cache if needed
        if (isDynamic) {
          trimCache(CACHE_NAME_DYNAMIC, MAX_DYNAMIC_CACHE_SIZE);
        }
      });
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);

    // If offline and not in cache, return offline page or error
    // For now, just throw the error
    throw error;
  }
}

// API request handler - Cache first with background update
async function handleAPIRequest(request) {
  try {
    // Check cache first
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // Return cached data immediately
      console.log('[SW] Serving API response from cache');

      // Fetch fresh data in background
      fetchAndCacheAPI(request);

      return cachedResponse;
    }

    // No cache - fetch from network
    console.log('[SW] No cache, fetching API from network');
    return await fetchAndCacheAPI(request);

  } catch (error) {
    console.error('[SW] API fetch failed:', error);

    // Try to return stale cache as last resort
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Returning stale API cache');
      return cachedResponse;
    }

    // No cache available - return error response
    return new Response(
      JSON.stringify({
        error: 'Offline - no cached data available',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Fetch API and cache the result
async function fetchAndCacheAPI(request) {
  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      const responseToCache = response.clone();
      const cache = await caches.open(CACHE_NAME_DYNAMIC);
      await cache.put(request, responseToCache);
      console.log('[SW] Cached fresh API response');

      // Trim cache
      await trimCache(CACHE_NAME_DYNAMIC, MAX_DYNAMIC_CACHE_SIZE);
    }

    return response;
  } catch (error) {
    console.error('[SW] fetchAndCacheAPI failed:', error);
    throw error;
  }
}

// Update cache in background (fire and forget)
async function updateCacheInBackground(request) {
  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response);
      console.log('[SW] Background cache update complete');
    }
  } catch (error) {
    // Silent fail - we already have cached version
    console.log('[SW] Background update failed (offline?)');
  }
}

// Message handler for manual cache updates
self.addEventListener('message', (event) => {
  // Validate sender is a controlled client from the same origin.
  // Browsers already enforce this for service workers, but being explicit
  // silences false-positive postMessage-origin warnings and adds defence-in-depth.
  if (!event.source || new URL(event.source.url).origin !== self.location.origin) {
    return;
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME_DYNAMIC)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-events') {
    event.waitUntil(
      fetch('/functions/api/events')
        .then((response) => {
          if (response.status === 200) {
            const cache = caches.open(CACHE_NAME_DYNAMIC);
            cache.then((c) => c.put('/functions/api/events', response.clone()));
          }
        })
        .catch((error) => {
          console.log('[SW] Background sync failed:', error);
        })
    );
  }
});

console.log('[SW] Service Worker loaded');
