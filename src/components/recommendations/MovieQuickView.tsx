"use client";
/* eslint-disable @next/next/no-img-element -- images TMDB externes */

import Link from "next/link";
import Dialog from "./Dialog";
import { useStreaming } from "./context";
import { genreNames } from "./genres";
import type { CardMovie } from "./movie";
import { btnDanger, btnPrimary, btnQuiet } from "./ui";

// Fiche rapide d'un film (ouverte au clic sur une affiche)
export default function MovieQuickView({
  movie,
  listId,
  onClose,
}: {
  movie: CardMovie | null;
  listId?: string;
  onClose: () => void;
}) {
  const { openAddToList, removeMovie, lists } = useStreaming();
  const ownsList = listId ? lists.some((l) => l.id === listId) : false;
  const image = movie?.backdropUrl ?? movie?.posterUrl;

  return (
    <Dialog
      open={movie !== null}
      onClose={onClose}
      labelledBy="quick-view-title"
      wide
    >
      {movie && (
        <article>
          <div className="relative aspect-video max-h-80 w-full overflow-hidden bg-[var(--raised)]">
            {image && (
              <img src={image} alt="" className="size-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--deep)] via-[var(--deep)]/30 to-transparent" />
          </div>
          <div className="-mt-16 relative space-y-3 px-5 pb-5 sm:px-7">
            <h2
              id="quick-view-title"
              className="text-3xl font-extrabold leading-none tracking-tight sm:text-4xl"
            >
              {movie.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--mist)]">
              {movie.match ? (
                <span className="font-bold text-[var(--marquee)]">
                  {movie.match} % pour vous
                </span>
              ) : null}
              {movie.year ? <span>{movie.year}</span> : null}
              {movie.rating ? (
                <span>
                  <span aria-hidden className="text-[var(--marquee)]">
                    ★{" "}
                  </span>
                  {movie.rating.toFixed(1)} / 10
                </span>
              ) : null}
              {genreNames(movie.genres).map((g) => (
                <span
                  key={g}
                  className="rounded border border-white/20 px-2 py-0.5 text-xs text-[var(--ink)]/80"
                >
                  {g}
                </span>
              ))}
            </div>
            {movie.overview ? (
              <p className="max-w-prose text-[15px] leading-relaxed text-[var(--ink)]/90">
                {movie.overview}
              </p>
            ) : (
              <p className="text-sm text-[var(--mist)]">
                Pas de résumé disponible pour ce film.
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                className={btnPrimary}
                onClick={() => {
                  onClose();
                  openAddToList(movie);
                }}
              >
                Ajouter à une liste
              </button>
              <Link
                href={`/movies/${movie.movieId}`}
                className={btnQuiet}
                onClick={onClose}
              >
                Voir la fiche et les avis
              </Link>
              {listId && ownsList && (
                <button
                  type="button"
                  className={btnDanger}
                  onClick={async () => {
                    if (await removeMovie(listId, movie)) onClose();
                  }}
                >
                  Retirer de cette liste
                </button>
              )}
              <button type="button" className={btnQuiet} onClick={onClose}>
                Fermer
              </button>
            </div>
          </div>
        </article>
      )}
    </Dialog>
  );
}
