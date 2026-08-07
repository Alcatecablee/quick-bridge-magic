// QuickBridge service worker - caches the app shell for installable PWA + offline-tolerant reloads.
// We deliberately stay out of the WebRTC / Supabase signaling path: only same-origin GETs to
// static assets and navigations are intercepted. WebSockets bypass fetch() entirely.

const CACHE = "quickbridge-shell-v4";
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
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE && k !== "qb-share-pending")
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Web Share Target: the OS calls this URL with a multipart POST when the user
// picks QuickBridge from the system share sheet. We read the files out of the
// FormData, stash them in a dedicated cache so the page can drain them on
// focus, and then redirect to the home page so the PWA opens (or is focused).
async function handleShareTarget(req) {
  try {
    const data = await req.formData();
    const files = data.getAll("files").filter((f) => f instanceof File);
    if (files.length > 0) {
      const pending = await caches.open("qb-share-pending");
      const key = String(Date.now());
      for (const file of files) {
        await pending.put(
          `/qb-share-pending/${key}/${encodeURIComponent(file.name)}`,
          new Response(file, {
            headers: {
              "Content-Type": file.type || "application/octet-stream",
              "X-QB-Share-Name": encodeURIComponent(file.name),
            },
          }),
        );
      }
    }
  } catch {
    return Response.redirect("/?share-error=1", 303);
  }
  return Response.redirect("/", 303);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Web Share Target: intercept before the GET-only guard below.
  if (req.method === "POST" && url.origin === self.location.origin && url.pathname === "/share-target") {
    event.respondWith(handleShareTarget(req));
    return;
  }

  if (req.method !== "GET") return;
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
          .catch(() => cached ?? new Response("Service unavailable. Check your connection.", { status: 503 }));
        return cached || networked;
      }),
    );
  }
});
