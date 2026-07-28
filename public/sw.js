/*
 * HeRide service worker — installability + a graceful offline screen.
 *
 * Deliberately conservative: ride data, driver positions and fares must never
 * be served stale, so ONLY the offline fallback and static icons are cached.
 * Every navigation goes to the network first; if the device is offline we show
 * the fallback page instead of the browser's error.
 */
const CACHE = "heride-shell-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  OFFLINE_URL,
  "/icon.svg",
  "/icon-maskable.svg",
  "/icon-192.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
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
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r ?? Response.error()),
      ),
    );
    return;
  }

  // Static brand assets: cache first (they never change within a version).
  const url = new URL(request.url);
  if (url.origin === self.location.origin && PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((r) => r ?? fetch(request)));
  }
});
