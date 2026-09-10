const CACHE_NAME = "herpcare-v3";
const APP_SHELL = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest", "./icon.svg"];
const APP_SCOPE_PATH = new URL(self.registration.scope).pathname;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const isSameOrigin = new URL(request.url).origin === self.location.origin;
        if (isSameOrigin && response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          const requestUrl = new URL(request.url);
          if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith(APP_SCOPE_PATH)) {
            const relativePath = requestUrl.pathname === APP_SCOPE_PATH
              ? "./"
              : `./${requestUrl.pathname.slice(APP_SCOPE_PATH.length)}`;
            return caches.match(relativePath).then((shellMatch) => {
              if (shellMatch) return shellMatch;
              if (request.mode === "navigate") {
                return caches.match("./index.html");
              }
              throw new Error(`No cached response for ${request.url}`);
            });
          }
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          throw new Error(`No cached response for ${request.url}`);
        })
      )
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
