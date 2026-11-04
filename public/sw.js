const CACHE_NAME = "movie-explorer-v1";
const OFFLINE_URL = "/offline";

// 💡 CORRECTION : On réduit les assets obligatoires à l'installation pour éviter le blocage 404 du dev
const PRECACHE_ASSETS = [
  "/",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];


// 1. Installation du Service Worker et mise en cache des fichiers de base
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Nettoyage des anciens caches lors de l'activation
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

// 3. Interception et stratégie de cache (Version corrigée pour Turbopack)
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  // 💡 EXCLUSION CRUCIALE : On laisse passer TOUT le trafic de dev Next.js/Turbopack/Auth
  if (
    request.url.includes("_next") ||
    request.url.includes("turbopack") ||
    request.url.includes("hmr") ||
    request.url.includes("hot-update") ||
    request.url.includes("/api/auth") ||
    request.url.startsWith("ws:") ||
    request.url.startsWith("wss:")
  ) {
    return; // Git ignore et bypass pour le développement
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
