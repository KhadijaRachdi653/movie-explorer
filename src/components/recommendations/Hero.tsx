"use client";
/* eslint-disable @next/next/no-img-element -- images TMDB externes */

import { useEffect, useState, useSyncExternalStore } from "react";
import { useStreaming } from "./context";
import { genreNames } from "./genres";
import type { CardMovie } from "./movie";
import { btnPrimary, btnSecondary } from "./ui";

const SLIDE_MS = 8000;

// Préférence système « réduire les animations »
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true
  );
}

// Bannière en carrousel : les meilleurs films défilent en fondu
export default function Hero({ movies, loading }: { movies: CardMovie[]; loading: boolean }) {
  const { openAddToList, openMovie } = useStreaming();
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // choix de l'utilisateur (bouton pause)
  const [hovered, setHovered] = useState(false); // survol ou focus clavier

  const count = movies.length;
  const autoplay = count > 1 && !paused && !hovered && !reducedMotion;

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [autoplay, count]);

  if (loading) return <div className="skeleton min-h-[max(78vh,520px)] w-full" aria-hidden />;
  if (count === 0) return null;
  const current = movies[index % count];

  return (
    <section
      className="relative isolate flex min-h-[max(78vh,520px)] items-end overflow-hidden pt-28"
      aria-roledescription="carrousel"
      aria-label="Films à la une"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false); }}
    >
      {movies.map((m, i) => {
        const image = m.backdropUrl ?? m.posterUrl;
        const active = i === index % count;
        return image ? (
          <img
            key={m.movieId}
            src={image}
            alt=""
            className={`absolute inset-0 -z-20 size-full object-cover object-top transition-[opacity,transform] ease-out ${
              active ? "scale-100 opacity-100 duration-[1200ms,9000ms]" : "scale-[1.06] opacity-0 duration-[1200ms,0ms]"
            }`}
          />
        ) : null;
      })}
      <div className="hero-shade absolute inset-0 -z-10" />

      <div key={current.movieId} className="hero-text w-full max-w-3xl px-4 pb-20 sm:px-8 sm:pb-24" aria-roledescription="diapositive" aria-label={`${(index % count) + 1} sur ${count}`}>
        {/* Titres longs plus petits : la bannière ne doit jamais passer sous la navigation */}
        <h1
          className={`text-balance font-extrabold leading-[0.92] tracking-[-0.035em] ${
            current.title.length > 20 ? "text-[clamp(2.2rem,5vw,4.25rem)]" : "text-[clamp(2.6rem,7vw,5.75rem)]"
          }`}
        >
          {current.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--mist)]">
          {current.match ? <span className="font-bold text-[var(--marquee)]">{current.match} % pour vous</span> : null}
          {current.year ? <span>{current.year}</span> : null}
          {current.rating ? <span><span aria-hidden className="text-[var(--marquee)]">★ </span>{current.rating.toFixed(1)}</span> : null}
          {genreNames(current.genreIds).map((g) => (
            <span key={g} className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-[var(--ink)]/85">{g}</span>
          ))}
        </div>
        {current.overview && <p className="mt-4 line-clamp-3 max-w-xl text-[15px] leading-relaxed text-[var(--ink)]/85 sm:text-base">{current.overview}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" className={`${btnPrimary} py-3 sm:px-6 sm:text-base`} onClick={() => openAddToList(current)}>
            <span aria-hidden className="text-lg leading-none">+</span> Ajouter à une liste
          </button>
          <button type="button" className={`${btnSecondary} py-3 sm:px-6 sm:text-base`} onClick={() => openMovie(current)}>
            Plus d’infos
          </button>
        </div>
      </div>

      {count > 1 && (
        <div className="absolute bottom-6 right-4 flex items-center gap-3 sm:right-8 sm:bottom-8">
          <div className="flex gap-2" role="group" aria-label="Choisir le film à la une">
            {movies.map((m, i) => (
              <button
                key={m.movieId}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Afficher ${m.title}`}
                aria-current={i === index % count ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === index % count ? "w-8 bg-[var(--marquee)]" : "w-3 bg-white/35 hover:bg-white/60"}`}
              />
            ))}
          </div>
          {!reducedMotion && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Reprendre le défilement" : "Mettre le défilement en pause"}
              className="flex size-8 items-center justify-center rounded-full border border-white/25 text-xs text-[var(--ink)] hover:bg-white/10"
            >
              <span aria-hidden>{paused ? "▶" : "❚❚"}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
