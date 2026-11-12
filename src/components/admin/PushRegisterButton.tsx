"use client";

import { useEffect, useState, startTransition } from "react";
import { savePushSubscription } from "@/actions/pushActions";

// Fonction utilitaire pour convertir la clé publique VAPID textuelle en tableau binaire requis par l'OS
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushRegisterButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérification du support natif des Push W3C PWA par le navigateur de l'admin
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      // Vérifie si ce terminal est déjà enregistré auprès du service worker
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  async function handleTogglePush() {
    if (!isSupported) return;
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        // 📴 Désactivation locale si déjà appairé
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          setIsSubscribed(false);
          setMessage(
            "Ce terminal a été déconnecté du flux des alertes système.",
          );
        }
        setLoading(false);
        return;
      }

      // 🔔 Activation : Demande l'autorisation native au système d'exploitation (OS Windows/Mobile)
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(
          "L'autorisation de notification a été refusée par le système.",
        );
        setLoading(false);
        return;
      }

      // Récupération de la clé publique environnementale
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError("Clé de chiffrement publique VAPID introuvable.");
        setLoading(false);
        return;
      }

      // Génération de la signature Push cryptographique auprès du serveur tiers (Google/Apple/MS)
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      const newSubscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });

      // Conversion de la structure brute pour l'envoi en Server Action Typée
      const subJson = newSubscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Données de clés asymétriques incomplètes.");
      }

      const formattedInput = {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
      };

      // 💾 Enregistrement sécurisé dans votre cluster MongoDB Atlas
      startTransition(async () => {
        const result = await savePushSubscription(formattedInput);
        if (result.error) {
          setError(result.error);
        } else {
          setIsSubscribed(true);
          setMessage(
            "✨ Appairage matériel réussi ! Votre OS interceptera les alertes d'abonnement.",
          );
        }
        setLoading(false);
      });
    } catch (err: any) {
      console.error("Échec du protocole Push PWA :", err);
      setError("Échec de la synchronisation cryptographique.");
      setLoading(false);
    }
  }

  if (!isSupported) return null;

  return (
    <div className="mb-8 rounded-[22px] bg-[var(--surface)] border border-[var(--border-subtle)] p-6 shadow-[0_14px_36px_rgba(39,33,22,0.04)] transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-[var(--accent)]">
            Abonnement aux Notifications PWA Natives
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-medium max-w-xl leading-relaxed">
            Activez la réception des alertes système en tâche de fond. Vous
            recevrez une notification Windows/Mobile chiffrée en temps réel au
            moindre changement de forfait ou résiliation de vos cinéphiles, même
            si CINEA est fermé.
          </p>
        </div>

        {/* 💡 BOUTON CONFORME FIGMA : Pas de bloc flashy, bordures légères, couleur champagne ou bronze mat */}
        <button
          onClick={handleTogglePush}
          disabled={loading}
          className={`px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm border whitespace-nowrap self-start sm:self-center ${
            isSubscribed
              ? "bg-transparent text-amber-600 border-amber-600/30 hover:bg-amber-500/5"
              : "bg-[var(--accent-light)] text-[#1B1B19] border-transparent hover:brightness-105"
          }`}
        >
          {loading
            ? "Configuration..."
            : isSubscribed
              ? "🔔 Désactiver les Push OS"
              : "🔔 Recevoir les Push OS ✨"}
        </button>
      </div>

      {/* Messages de statuts feutrés et désaturés selon la palette */}
      {error && (
        <p className="text-xs text-amber-600 font-semibold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 mt-4 animate-fade-in">
          ⚠️ {error}
        </p>
      )}
      {message && (
        <p className="text-xs text-emerald-600 font-semibold bg-green-500/10 p-3 rounded-xl border border-green-500/20 mt-4 animate-fade-in">
          {message}
        </p>
      )}
    </div>
  );
}
