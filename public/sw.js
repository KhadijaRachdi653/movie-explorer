const CACHE_NAME = "movie-explorer-v6";
const OFFLINE_URL = "/offline";

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

// 3. Interception et stratégie de cache (Version corrigée pour Turbopack & API)
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  if (
    request.url.includes("_next") ||
    request.url.includes("turbopack") ||
    request.url.includes("hmr") ||
    request.url.includes("hot-update") ||
    request.url.includes("/api/") ||
    request.headers.get("RSC") ||
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

// =========================================================================
// 4. GESTION DES NOTIFICATIONS PUSH NATIVES (W3C Push API)
// =========================================================================

self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn("Événement Push reçu mais sans aucune donnée textuelle.");
    return;
  }

  try {
    const data = event.data.json();

    const options = {
      body: data.body || "Une action a été réalisée sur la plateforme.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate:,
      data: {
        userId: data.userId
      },
      tag: "cinea-subscription-alert",
      actions: [
        { action: "explore", title: "Inspecter la fiche" }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "CINEA", options)
    );
  } catch (err) {
    console.error("Erreur d'analyse du payload Push :", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  notification.close();

  const userId = notification.data && notification.data.userId;
  const targetUrl = userId ? `/admin/users/${userId}` : "/admin/users";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.navigate(targetUrl).then((c) => c.focus());
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
