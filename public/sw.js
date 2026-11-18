// CalcPro service worker — offline app shell. Currency API requests are never intercepted
// (the app keeps its own last-good copy of the rates in localStorage).
const CACHE = "calcpro-v3";

// cache the page plus every hashed asset it references, so the first visit is enough for offline
async function precache() {
  const cache = await caches.open(CACHE);
  const res = await fetch("/", { cache: "no-store" });
  if (!res.ok) return;
  const html = await res.clone().text();
  await cache.put("/", res);
  // the build uses relative paths ("./assets/...") since v1.0; accept both forms
  const assets = [...html.matchAll(/(?:src|href)="\.?(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  await cache.addAll([...new Set(assets), "/manifest.json", "/favicon.svg", "/theme-init.js", "/icons/icon-192.png"]);
}

self.addEventListener("install", (e) => {
  e.waitUntil(precache().catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;

  // pages: network first so deploys show up immediately, cached shell when offline
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // hashed assets, icons, fonts: cache first, fill on miss
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
