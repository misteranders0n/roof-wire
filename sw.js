// Roof Wire offline cache. Bump VERSION whenever any app file changes.
const VERSION = "roofwire-563202c2e1";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./vendor/jspdf.umd.min.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png", "./icons/favicon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  // App page: try the network first so updates show up, fall back to the cached copy offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(ca => ca.put("./index.html", c)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // Everything else (app files, Google Fonts): cached copy first, refreshed in the background.
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(VERSION).then(async ca => {
      const hit = await ca.match(req);
      const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) ca.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
