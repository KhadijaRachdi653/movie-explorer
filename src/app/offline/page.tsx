"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FilmLeader from "@/components/cinema/FilmLeader";

// Page hors ligne (PWA, Module 1) : servie par le service worker quand le réseau est coupé
export default function OfflinePage() {
  const router = useRouter();
  const [isReconnecting, setIsLoading] = useState(false);
  const [online, setOnline] = useState(false);

  function handleRetry() {
    setIsLoading(true);
    if (navigator.onLine) {
      router.push("/");
      router.refresh();
    } else {
      setTimeout(() => setIsLoading(false), 1000);
    }
  }

  // Reprise automatique dès que la connexion revient
  useEffect(() => {
    const back = () => {
      setOnline(true);
      // rechargement complet volontaire : la page actuelle a été servie par le service worker
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      setTimeout(() => window.location.assign("/"), 1200);
    };
    window.addEventListener("online", back);
    return () => window.removeEventListener("online", back);
  }, []);

  return (
    <main className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[var(--night)] px-6 py-16 text-center text-[var(--ink)]">
      {/* faisceau du projecteur */}
      <div aria-hidden className="absolute left-1/2 top-0 -z-10 h-[70vh] w-[120vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(242,181,68,0.16),transparent_60%)]" />

      <FilmLeader size={200} />

      <p className="mt-10 text-sm font-semibold tracking-[0.3em] text-[var(--marquee)]">ENTRACTE</p>
      <h1 className="mt-3 text-balance text-[clamp(2.4rem,7vw,4.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
        La séance est en pause.
      </h1>
      <p className="mt-5 max-w-md text-lg text-[var(--ink)]/75">
        Votre connexion s’est interrompue. Le film reprendra dès que le réseau sera de retour.
      </p>

      <p role="status" className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-[var(--edge)] bg-[var(--deep)] px-4 py-2 text-sm">
        <span aria-hidden className={`size-2 rounded-full ${online ? "bg-emerald-400" : "animate-pulse bg-[var(--marquee)]"}`} />
        {online ? "Connexion rétablie, reprise de la séance…" : "En attente du réseau"}
      </p>

      <button
        onClick={handleRetry}
        disabled={isReconnecting}
        className="mt-8 rounded-md bg-[var(--marquee)] px-7 py-3.5 text-base font-semibold text-[#1a1203] shadow-lg shadow-black/40 transition-colors hover:bg-[#f7c766] disabled:opacity-60"
      >
        {isReconnecting ? "Vérification…" : "Réessayer maintenant"}
      </button>
      <p className="mt-6 max-w-sm text-xs text-[var(--mist)]">Les pages déjà visitées restent disponibles hors connexion.</p>
    </main>
  );
}
