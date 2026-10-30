const CACHE_NAME = "movie-explorer-v2";
const OFFLINE_URL = "/offline";

const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // On utilise |no-cors| sur les routes internes si nécessaire, ou on force l'ajout
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // À remplacer dans l'événement "fetch" :
  if (request.method !== "GET") return;

  // 💡 AJOUT : Ignorer le HMR de Turbopack, Webpack, l'API Auth et les WebSockets de dev
  if (
    request.url.includes("_next/webpack") ||
    request.url.includes("hot-update") ||
    request.url.includes("_next/hmr") ||
    request.url.includes("/api/auth") || // Évite de mettre en cache les sessions d'authentification
    request.url.includes("/api/saved-searches") || // Données personnelles qui changent (CRUD) : jamais en cache
    request.url.startsWith("ws:") ||
    request.url.startsWith("wss:")
  ) {
    return;
  }

  // Gestion de la navigation principale (Changement de page)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(OFFLINE_URL) || caches.match("/");
      })
    );
    return;
  }

  // Stratégie Stale-While-Revalidate pour les autres assets (images, css, js)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then((response) => {
          // Ne mettre en cache que les réponses valides et provenant de notre propre domaine
          if (response && response.status === 200 && response.url.startsWith(self.location.origin)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkResponse;
    })
  );
});
