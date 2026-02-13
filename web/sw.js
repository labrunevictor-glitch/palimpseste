/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔧 SERVICE WORKER - Palimpseste
 * Cache-first pour les assets statiques, network-first pour les APIs
 * ═══════════════════════════════════════════════════════════════════════════
 */

const CACHE_VERSION = 'palimpseste-v3';
const STATIC_CACHE = CACHE_VERSION + '-static';
const API_CACHE = CACHE_VERSION + '-api';

// Assets statiques à pré-cacher
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/variables.css',
    '/css/base.css',
    '/css/styles.css',
    '/css/mobile.css',
    '/manifest.json',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg'
];

// Installation: pré-cacher les assets statiques
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activation: nettoyer les anciens caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== STATIC_CACHE && key !== API_CACHE)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Stratégie de fetch
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer les requêtes non-GET
    if (request.method !== 'GET') return;

    // APIs externes (Wikisource, Gutenberg, etc.): network-first avec cache fallback
    if (isExternalAPI(url)) {
        event.respondWith(networkFirstWithCache(request, API_CACHE, 60 * 60)); // 1h cache
        return;
    }

    // APIs Supabase: toujours réseau, pas de cache
    if (url.hostname.includes('supabase.co')) return;

    // CDN (lucide, dompurify, supabase SDK): cache-first longue durée
    if (url.hostname.includes('unpkg.com') || url.hostname.includes('jsdelivr.net')) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // Assets statiques locaux: cache-first
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // Tout le reste: network-first
    event.respondWith(networkFirstWithCache(request, STATIC_CACHE, 24 * 60 * 60));
});

/**
 * Vérifie si l'URL est une API externe de contenu
 */
function isExternalAPI(url) {
    return url.hostname.includes('wikisource.org') ||
           url.hostname.includes('wikipedia.org') ||
           url.hostname.includes('wikimedia.org') ||
           url.hostname.includes('gutenberg.org') ||
           url.hostname.includes('gutendex.com') ||
           url.hostname.includes('poetrydb.org') ||
           url.hostname.includes('archive.org') ||
           url.hostname.includes('gallica.bnf.fr') ||
           url.hostname.includes('perseus.tufts.edu') ||
           url.hostname.includes('sacred-texts.com');
}

/**
 * Vérifie si c'est un asset statique
 */
function isStaticAsset(url) {
    return /\.(css|js|svg|png|jpg|jpeg|gif|woff2?|ttf|eot|ico)(\?.*)?$/.test(url.pathname);
}

/**
 * Stratégie cache-first
 */
async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (e) {
        return new Response('Offline', { status: 503 });
    }
}

/**
 * Stratégie network-first avec fallback cache
 */
async function networkFirstWithCache(request, cacheName, maxAge) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (e) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }
}
