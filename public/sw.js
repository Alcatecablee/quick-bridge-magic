// QuickBridge service worker - caches the app shell for installable PWA + offline-tolerant reloads.
// We deliberately stay out of the WebRTC / Supabase signaling path: only same-origin GETs to
// static assets and navigations are intercepted. WebSockets bypass fetch() entirely.

const CACHE = "quickbridge-shell-v2";
const SHELL = ["/", "/manifest.webmanifest", "/favicon.ico", "/favicon-32.png", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .catch(() => {})
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
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, fallback to cached "/"
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match("/").then((r) => r || new Response("Offline", { status: 503 })),
      ),
    );
    return;
  }

  // Static assets: stale-while-revalidate
  if (/\.(?:js|css|svg|png|jpg|jpeg|webp|ico|woff2?|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const networked = fetch(req)
          .then((res) => {
            if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || networked;
      }),
    );
  }
});
