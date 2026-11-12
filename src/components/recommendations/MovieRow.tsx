"use client";

import { useRef, type ComponentProps } from "react";
import MovieCard from "./MovieCard";
import type { CardMovie } from "./movie";

const itemWidth = "w-[38vw] shrink-0 sm:w-40 lg:w-44";

// Rangée horizontale d'affiches, avec flèches sur grand écran
export default function MovieRow({
  title,
  movies,
  loading = false,
  listId,
  quickAction,
}: {
  title: string;
  movies: CardMovie[];
  loading?: boolean;
  listId?: string;
  quickAction?: (m: CardMovie) => ComponentProps<typeof MovieCard>["quickAction"];
}) {
  const scroller = useRef<HTMLUListElement>(null);
  const scrollBy = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.85, behavior: "smooth" });

  if (!loading && movies.length === 0) return null;

  return (
    <section className="group/row relative" aria-label={title}>
      <h2 className="mb-3 px-4 text-lg font-bold sm:px-8 sm:text-xl">{title}</h2>
      <ul ref={scroller} className="row-scroller flex scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:scroll-px-8 sm:gap-4 sm:px-8">
        {loading
          ? Array.from({ length: 7 }, (_, i) => (
              <li key={i} className={itemWidth} aria-hidden>
                <div className="skeleton aspect-[2/3] rounded-md" />
                <div className="skeleton mt-2 h-3 w-3/4 rounded" />
              </li>
            ))
          : movies.map((m) => (
              <li key={m.movieId} className={itemWidth}>
                <MovieCard movie={m} listId={listId} quickAction={quickAction?.(m)} />
              </li>
            ))}
      </ul>
      {!loading && movies.length > 5 && (
        <>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label={`Défiler ${title} vers la gauche`}
            className="absolute left-0 top-10 hidden h-[calc(100%-4.5rem)] w-10 items-center justify-center bg-gradient-to-r from-[var(--night)] to-transparent text-3xl opacity-0 transition-opacity group-hover/row:opacity-100 focus:opacity-100 sm:flex"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label={`Défiler ${title} vers la droite`}
            className="absolute right-0 top-10 hidden h-[calc(100%-4.5rem)] w-10 items-center justify-center bg-gradient-to-l from-[var(--night)] to-transparent text-3xl opacity-0 transition-opacity group-hover/row:opacity-100 focus:opacity-100 sm:flex"
          >
            ›
          </button>
        </>
      )}
    </section>
  );
}
