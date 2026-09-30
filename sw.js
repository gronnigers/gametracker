/* GameTrack service worker — app-shell cache + update handshake (same pattern as Dwellness).
   Bump VERSION on every release (keep it in sync with APP_VERSION in index.html).
   A new worker installs and WAITS; the page shows "Update ready" and sends
   SKIP_WAITING when the user taps Update. Only same-origin GETs are touched —
   Graph / login / IGDB Worker / YouTube calls pass straight through. */
const VERSION = "2.15.1";
const CACHE = "gametrack-" + VERSION;
const SHELL = ["./", "index.html"];

self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("gametrack-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
  if (e.data === "GET_VERSION" && e.ports[0]) e.ports[0].postMessage(VERSION);
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.search.includes("code=")) return;
  // network-first so a reload always gets the latest files; cache is the offline fallback
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request).then(r => r || (e.request.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});
