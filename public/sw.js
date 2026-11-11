const SCOPE = self.registration.scope;
const SCOPE_PATH = new URL(SCOPE).pathname;
const CACHE_PREFIX = `faithai-public-${encodeURIComponent(SCOPE_PATH)}-`;
const SHELL_CACHE = `${CACHE_PREFIX}v6`;
const SHELL_INDEX = new URL("index.html", SCOPE).toString();
const TEXT_SHELL = [SCOPE, SHELL_INDEX, new URL("manifest.webmanifest", SCOPE).toString()];

function canCache(response) {
  return response.ok && !/no-store|private/i.test(response.headers.get("cache-control") || "");
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then(async (cache) => {
    await Promise.all(TEXT_SHELL.map(async (url) => {
      const response = await fetch(url, { cache: "reload" });
      if (canCache(response)) await cache.put(url, response);
    }));
  }).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) =>
    key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE || /^faithai-(shell|runtime)-v\d+$/.test(key)
  ).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.search) return;
  const shell = TEXT_SHELL.includes(url.toString());
  const asset = url.pathname.startsWith(`${SCOPE_PATH}assets/`) && /\.(js|css|woff2?)$/.test(url.pathname);
  // APIs, help selections, exports, safety exploration and private routes are network-only.
  if (!shell && !asset) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(async (response) => {
      if (canCache(response)) { const cache = await caches.open(SHELL_CACHE); await cache.put(SHELL_INDEX, response.clone()); }
      return response;
    }).catch(() => caches.match(SHELL_INDEX)));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then(async (response) => {
    if (canCache(response)) { const cache = await caches.open(SHELL_CACHE); await cache.put(request, response.clone()); }
    return response;
  })));
});
