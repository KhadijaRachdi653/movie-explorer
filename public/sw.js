const CACHE_NAME = "movie-explorer-v6"; // v6 : nouvelles icônes (v5 : purge des réponses /api/)
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
    request.url.includes("/api/") || // Jamais de cache pour l'API : données personnelles et toujours à jour
    request.headers.get("RSC") ||
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

// =========================================================================
// 🔔 4. INJECTION : GESTION DES NOTIFICATIONS PUSH NATIVES (W3C Push API)
// =========================================================================

// Écouteur de signal Push : Intercepte la requête cryptée envoyée par Next.js
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn("⚠️ Événement Push reçu mais sans aucune donnée textuelle.");
    return;
  }

  try {
    // Décodage du payload JSON sécurisé envoyé par userActions.ts
    const data = event.data.json();

    const options = {
      body: data.body || "Une action a été réalisée sur la plateforme.",
      icon: "/icons/icon-192.png",       // Utilisation de vos icônes existantes
      badge: "/icons/icon-192.png",      // Icône d'état système
      vibrate: [100, 50, 100], // Séquence de vibration mobile
      data: {
        userId: data.userId              // Mémorisation de l'ID pour la redirection
      },
      tag: "cinea-subscription-alert",   // Empêche l'empilement des notifications
      actions: [
        { action: "explore", title: "🔍 Inspecter la fiche" }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "CINEA 🎬", options)
    );
  } catch (err) {
    console.error("Erreur d'analyse du payload Push :", err);
  }
});

// Écouteur de clic : Redirige l'administrateur directement vers la fiche d'audit
self.addEventListener("notificationclick", (event) => {
  const notification = event.notification;
  notification.close(); // Ferme la bulle système de l'OS

  const userId = notification.data && notification.data.userId;
  const targetUrl = userId ? `/admin/users/${userId}` : "/admin/users";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Si la PWA est déjà ouverte, on navigue vers la fiche et on met le focus dessus
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.navigate(targetUrl).then((c) => c.focus());
        }
      }
      // Si elle était fermée, le système d'exploitation ouvre une nouvelle fenêtre isolée
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
