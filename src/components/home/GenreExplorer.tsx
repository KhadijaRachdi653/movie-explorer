"use client";
/* eslint-disable @next/next/no-img-element -- affiches du catalogue */

import { useState } from "react";
import Link from "next/link";

type GenreMovie = { id: string; title: string; posterUrl: string; year: number; rating: number };

// « Explorer par genre » : un bouton par genre, la grille d'affiches change sans recharger la page
export default function GenreExplorer({ genres }: { genres: { name: string; count: number; movies: GenreMovie[] }[] }) {
  const [active, setActive] = useState(genres[0]?.name ?? "");
  const current = genres.find((g) => g.name === active) ?? genres[0];
  if (!current) return null;

  return (
    <section aria-labelledby="genres-title" className="px-4 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="genres-title" className="text-[clamp(1.8rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.03em]">Explorer par genre</h2>
        <Link href="/discover" className="text-sm font-semibold text-[var(--marquee)] hover:underline">Recherche avancée</Link>
      </div>

      <div role="tablist" aria-label="Genres" className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        {genres.map((g) => (
          <button
            key={g.name}
            type="button"
            role="tab"
            aria-selected={g.name === current.name}
            onClick={() => setActive(g.name)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              g.name === current.name
                ? "border-[var(--marquee)] bg-[var(--marquee)] text-[#1a1203]"
                : "border-[var(--edge)] text-[var(--ink)]/85 hover:border-[var(--marquee)] hover:text-[var(--marquee)]"
            }`}
          >
            {g.name} <span className="ml-1 opacity-60">{g.count}</span>
          </button>
        ))}
      </div>

      <ul key={current.name} role="tabpanel" aria-label={`Films : ${current.name}`} className="genre-grid mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
        {current.movies.slice(0, 12).map((m, i) => (
          <li key={m.id} style={{ animationDelay: `${i * 35}ms` }}>
            <Link href={`/movies/${m.id}`} className="group relative block overflow-hidden rounded-md ring-1 ring-white/5 transition duration-200 hover:-translate-y-1 hover:ring-[var(--marquee)]/70" aria-label={`${m.title}, ${m.year}`}>
              <img src={m.posterUrl} alt="" loading="lazy" className="aspect-[2/3] w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2.5 pt-10 text-xs opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="line-clamp-2 font-semibold text-[var(--ink)]">{m.title}</span>
                <span className="text-[var(--mist)]"><span className="text-[var(--marquee)]">★</span> {m.rating.toFixed(1)} · {m.year}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
