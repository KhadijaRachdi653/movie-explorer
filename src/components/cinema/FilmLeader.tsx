"use client";

import { useEffect, useState } from "react";

/**
 * Amorce de pellicule (« film leader ») : cercles, réticule, aiguille qui balaie et compte à rebours 3, 2, 1.
 * Purement décoratif (aria-hidden). Animation arrêtée si l'utilisateur réduit les mouvements.
 */
export default function FilmLeader({ size = 220 }: { size?: number }) {
  const [n, setN] = useState(3);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setN((v) => (v === 1 ? 3 : v - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div aria-hidden className="leader relative isolate" style={{ width: size, height: size }}>
      {/* halo du projecteur */}
      <div className="leader-glow absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle,rgba(242,181,68,0.25),transparent_65%)]" />
      <div className="absolute inset-0 overflow-hidden rounded-full border-2 border-[var(--marquee)]/70 bg-[var(--deep)]">
        <div className="leader-sweep absolute inset-0 bg-[conic-gradient(from_0deg,rgba(242,181,68,0.35)_0deg,rgba(242,181,68,0.08)_90deg,transparent_90deg)]" />
      </div>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
        <circle cx="50" cy="50" r="38" fill="none" stroke="var(--marquee)" strokeOpacity="0.55" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="var(--marquee)" strokeOpacity="0.35" strokeWidth="0.6" />
        <line x1="50" y1="2" x2="50" y2="98" stroke="var(--marquee)" strokeOpacity="0.35" strokeWidth="0.5" />
        <line x1="2" y1="50" x2="98" y2="50" stroke="var(--marquee)" strokeOpacity="0.35" strokeWidth="0.5" />
      </svg>
      <span key={n} className="leader-number absolute inset-0 flex items-center justify-center font-extrabold leading-none text-[var(--ink)]" style={{ fontSize: size * 0.42 }}>
        {n}
      </span>
    </div>
  );
}
