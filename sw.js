const CACHE_NAME = 'dancing-v2';
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './assets/css/dancing.css',
    './assets/js/dancing.js',
    './assets/img/dancing/her.svg'
];
const MEDIA_ASSETS = [
    './assets/img/dancing/dancing_ascii/frames.json',
    './assets/music/Nick Cave & The Bad Seeds - O Children (Official Audio).mp3'
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(CORE_ASSETS);
        await cache.addAll(MEDIA_ASSETS).catch(() => {});
    })());
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    if (event.request.mode === 'navigate') {
        event.respondWith(networkFirst(event.request));
        return;
    }

    if (url.origin === self.location.origin) {
        event.respondWith(cacheFirst(event.request));
    }
});

async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response && response.ok) {
        cache.put(request, response.clone());
    }
    return response;
}

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw error;
    }
}
