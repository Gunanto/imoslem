const CACHE_NAME = "imoslem-v6";
const API_CACHE_NAME = "imoslem-api-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

// Install event: cache initial assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate event: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== API_CACHE_NAME)
            .map((key) => caches.delete(key)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch event: stale-while-revalidate for assets, network-first for API
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isCoreAsset =
    isSameOrigin &&
    (url.pathname.endsWith("/index.html") ||
      url.pathname.endsWith("/app.js") ||
      url.pathname.endsWith("/styles.css"));

  // Strategy for API calls: Network First
  if (url.hostname === "api.myquran.com") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(API_CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        }),
    );
    return;
  }

  // Strategy for core app shell assets: Network First
  if (isCoreAsset || event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  // Strategy for local assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    }),
  );
});
