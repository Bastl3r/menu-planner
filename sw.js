const CACHE_NAME = "menu-matcher-cache-v1";

// Static assets to pre-cache upon service worker installation
const ASSETS_TO_CACHE = [
    "./menu_planner.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js",
    "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"
];

// Install Event: Caches critical assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate Event: Cleans up old caches if CACHE_NAME changes
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event: Network-First Strategy with Cache Fallback
self.addEventListener("fetch", (event) => {
    // Only handle HTTP/HTTPS GET requests
    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If network request succeeds, update the cache copy in the background
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // If network fails (offline), attempt to serve from cache
                return caches.match(event.request);
            })
    );
});