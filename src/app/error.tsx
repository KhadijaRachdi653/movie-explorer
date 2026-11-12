"use client";

import { useEffect } from "react";
import Link from "next/link";

// Erreur inattendue dans une page : message clair, sans détail technique, et possibilité de réessayer
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error); // le détail reste dans la console, jamais à l'écran
  }, [error]);

  return (
    <main className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <div aria-hidden className="absolute left-1/2 top-0 -z-10 h-[60vh] w-[120vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(240,138,126,0.12),transparent_60%)]" />
      {/* clap de cinéma */}
      <svg aria-hidden viewBox="0 0 120 100" className="w-32">
        <g className="origin-[10px_38px] -rotate-12">
          <rect x="10" y="22" width="100" height="16" rx="3" fill="var(--ink)" />
          {[0, 1, 2, 3, 4].map((i) => <polygon key={i} points={`${18 + i * 20},22 ${30 + i * 20},22 ${24 + i * 20},38 ${12 + i * 20},38`} fill="var(--night)" />)}
        </g>
        <rect x="10" y="42" width="100" height="52" rx="5" fill="var(--marquee)" />
        <rect x="22" y="56" width="60" height="5" rx="2" fill="#1a1203" opacity="0.35" />
        <rect x="22" y="70" width="44" height="5" rx="2" fill="#1a1203" opacity="0.35" />
      </svg>
      <h1 className="mt-8 text-balance text-[clamp(2.4rem,6vw,4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">Coupez !</h1>
      <p className="mt-4 max-w-md text-lg text-[var(--ink)]/75">Une erreur s’est glissée dans la prise. Réessayez : ça arrive même aux meilleurs tournages.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="rounded-md bg-[var(--marquee)] px-6 py-3 font-semibold text-[#1a1203] hover:bg-[#f7c766]">Refaire la prise</button>
        <Link href="/" className="rounded-md bg-white/10 px-6 py-3 font-semibold hover:bg-white/20">Retour à l’accueil</Link>
      </div>
    </main>
  );
}
