const SHELL = 'shell-v1';
const STATIC = 'static-v1';
// Also cleared by the app on logout
const DATA = 'supabase-data';
// The app's root path, e.g. "/house-rent-mg/" on GitHub Pages; sw.js sits there
const BASE = new URL('./', self.location).pathname;
const ASSETS = `${BASE}assets/`;

// Caches index.html plus the hashed assets files it references, and drops assets of older builds
async function cacheShell(response) {
  const html = await response.clone().text();
  const assets = [...new Set(html.match(new RegExp(`${ASSETS}[^"'\\s>]+`, 'g')) ?? [])];
  const cache = await caches.open(SHELL);
  await cache.put(BASE, response);
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname;
    if (path.startsWith(ASSETS) && !assets.includes(path)) await cache.delete(request);
  }
  await Promise.all(assets.map(async (asset) => (await cache.match(asset)) || cache.add(asset)));
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request, {ignoreVary: true});
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  // ignoreVary: module scripts send an Origin header that the shell's precached copies were stored without
  const cached = await caches.match(request, {ignoreVary: true});
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(cacheName)).put(request, response.clone());
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(fetch(BASE).then(cacheShell).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const {request} = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    // Network first so a new deploy shows up as soon as there's a connection
    event.respondWith(fetch(request)
      .then((response) => {
        if (response.ok) event.waitUntil(cacheShell(response.clone()));
        return response;
      })
      .catch(async () => (await caches.match(BASE)) ?? Response.error()));
  } else if (url.origin === location.origin || /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    event.respondWith(cacheFirst(request, STATIC));
  } else if (url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/')) {
    event.respondWith(networkFirst(request, DATA));
  }
});
