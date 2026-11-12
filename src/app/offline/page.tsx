"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OfflinePage() {
  const router = useRouter();
  const [isReconnecting, setIsLoading] = useState(false);

  function handleRetry() {
    setIsLoading(true);

    // Simule une vérification rapide du statut réseau avant de recharger l'accueil
    if (navigator.onLine) {
      router.push("/");
      router.refresh();
    } else {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000); // Petit effet fluide de chargement Material 3
    }
  }

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center px-4 text-center text-[var(--text-primary)] transition-all">
      {/* 📡 ICÔNE DE STATUT ESTOMPÉE STYLE PREMIUM */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--surface-variant)] shadow-xl text-3xl text-[var(--accent-light,#D7BC83)] animate-pulse">
        📶
      </div>

      {/* TITRE ET TEXTES SÉMANTIQUES ASSORTIS */}
      <h1 className="text-3xl font-black tracking-tight mb-2 text-[var(--accent,#8C692E)]">
        Mode hors-ligne actif
      </h1>
      <p className="text-sm text-[var(--text-muted)] max-w-sm mb-8 font-medium leading-relaxed">
        Votre connexion Internet semble interrompue. <br />
        CINEA continue de fonctionner ! Vous pouvez naviguer sur vos pages et
        catalogues déjà mis en cache.
      </p>

      {/* 💡 BOUTON CHAMPAGNE SATINÉ RE-TENTATIVE */}
      <button
        onClick={handleRetry}
        disabled={isReconnecting}
        className="px-6 py-3 bg-[var(--accent-light,#D7BC83)] text-[#1B1B19] text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md hover:brightness-110 disabled:opacity-50 cursor-pointer"
      >
        {isReconnecting
          ? "Vérification en cours..."
          : "🔄 Réessayer de se connecter"}
      </button>

      {/* MESSAGE SECONDAIRE DISCRET */}
      <p className="text-[11px] text-[var(--text-muted)] mt-4 font-bold uppercase tracking-wider">
        Application autonome synchronisée
      </p>
    </div>
  );
}
