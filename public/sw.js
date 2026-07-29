/*
 * HeRide service worker — installability + a graceful offline screen.
 *
 * Deliberately conservative: ride data, driver positions and fares must never
 * be served stale, so ONLY the offline fallback and static icons are cached.
 * Every navigation goes to the network first; if the device is offline we show
 * the fallback page instead of the browser's error.
 */
const CACHE = "heride-shell-v2";
const OFFLINE_URL = "/offline.html";
const STATIC_ASSETS = ["/icon.svg", "/icon-maskable.svg", "/icon-192.png", "/manifest.webmanifest"];

/**
 * Cache the offline page as a FRESH response.
 *
 * Hosts with clean-URLs (Vercel rewrites /offline.html → /offline with a 308)
 * would otherwise hand us a redirected response, and the browser refuses to
 * serve a redirected response for a navigation — which would silently break
 * the fallback. Re-wrapping the body strips the redirect flag, so this works
 * the same on any host.
 */
async function cacheOfflinePage(cache) {
  const response = await fetch(OFFLINE_URL, { cache: "reload", redirect: "follow" });
  if (!response.ok) throw new Error(`offline page ${response.status}`);
  const body = await response.blob();
  await cache.put(
    OFFLINE_URL,
    new Response(body, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Static assets are best-effort: a single 404 must not fail the install
      // and leave the app with no service worker at all.
      await Promise.allSettled(STATIC_ASSETS.map((url) => cache.add(url)));
      await cacheOfflinePage(cache);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Navigations: network first, offline page as the fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(OFFLINE_URL);
        return cached ?? Response.error();
      }),
    );
    return;
  }

  // Static brand assets: cache first (they never change within a version).
  const url = new URL(request.url);
  if (url.origin === self.location.origin && STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((r) => r ?? fetch(request)));
  }
});
