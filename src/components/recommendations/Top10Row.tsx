"use client";

import Poster from "./Poster";
import { useStreaming } from "./context";
import type { CardMovie } from "./movie";

// « Top 10 » : un vrai classement, d'où les grands numéros à côté des affiches
export default function Top10Row({ title, subtitle, movies }: { title: string; subtitle?: string; movies: CardMovie[] }) {
  const { openMovie, openAddToList } = useStreaming();
  if (movies.length === 0) return null;

  return (
    <section aria-label={title}>
      <div className="mb-3 px-4 sm:px-8">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--mist)]">{subtitle}</p>}
      </div>
      <ol className="row-scroller flex scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:scroll-px-8 sm:px-8">
        {movies.slice(0, 10).map((m, i) => (
          <li key={m.movieId} className="group relative flex shrink-0 items-end">
            <span
              aria-hidden
              className="-mr-3 select-none text-[7.5rem] font-extrabold leading-[0.8] tracking-[-0.08em] text-[var(--night)] sm:text-[9.5rem]"
              style={{ WebkitTextStroke: "2px var(--marquee)" }}
            >
              {i + 1}
            </span>
            <div className="relative w-[32vw] shrink-0 sm:w-36 lg:w-40">
              <button
                type="button"
                onClick={() => openMovie(m)}
                aria-label={`Numéro ${i + 1} : ${m.title}${m.match ? `, ${m.match} % pour vous` : ""}`}
                className="block w-full overflow-hidden rounded-md ring-1 ring-white/5 transition duration-200 group-hover:-translate-y-1 group-hover:ring-[var(--marquee)]/70"
              >
                <Poster src={m.posterUrl} title={m.title} />
              </button>
              <button
                type="button"
                onClick={() => openAddToList(m)}
                aria-label={`Ajouter ${m.title} à une liste`}
                className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-black/70 font-bold text-white opacity-0 backdrop-blur transition hover:bg-[var(--marquee)] hover:text-[#1a1203] focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
              >
                <span aria-hidden>+</span>
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
