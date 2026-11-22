const CACHE_NAME = "herpcare-v6";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./security_config.js",
  "./auth.js",
  "./data_service.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./terracarium-home.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => caches.match("./index.html")))
  );
});
