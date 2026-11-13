"use client";

import Poster from "./Poster";
import FavoriteBadge from "@/components/collection/FavoriteBadge";
import { useStreaming } from "./context";
import type { CardMovie } from "./movie";

// Carte d'affiche : clic = fiche du film ; bouton + = ranger dans une liste
export default function MovieCard({
  movie,
  listId,
  quickAction,
}: {
  movie: CardMovie;
  listId?: string; // liste affichée (pour « Retirer » dans la fiche)
  quickAction?: { label: string; icon: string; onClick: (m: CardMovie) => void; done?: boolean };
}) {
  const { openMovie, openAddToList } = useStreaming();
  const action = quickAction ?? { label: `Ajouter ${movie.title} à une liste`, icon: "+", onClick: openAddToList };

  return (
    <div className="group relative">
      <FavoriteBadge movieId={movie.movieId} />
      <button
        type="button"
        onClick={() => openMovie(movie, listId)}
        className="block w-full overflow-hidden rounded-md bg-[var(--deep)] ring-1 ring-white/5 transition duration-200 group-hover:-translate-y-1 group-hover:ring-[var(--marquee)]/70"
        aria-label={`Voir la fiche de ${movie.title}`}
      >
        <Poster src={movie.posterUrl} title={movie.title} />
      </button>
      <button
        type="button"
        onClick={() => action.onClick(movie)}
        disabled={action.done}
        aria-label={action.label}
        title={action.label}
        className={`absolute right-2 top-2 flex size-9 items-center justify-center rounded-full text-lg font-bold shadow-lg transition ${
          action.done
            ? "bg-[var(--marquee)] text-[#1a1203] opacity-100"
            : "bg-black/70 text-white opacity-0 backdrop-blur hover:bg-[var(--marquee)] hover:text-[#1a1203] focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        }`}
      >
        <span aria-hidden>{action.done ? "✓" : action.icon}</span>
      </button>
      <p className="mt-2 line-clamp-1 text-sm font-medium">{movie.title}</p>
      {movie.match ? (
        <p className="text-xs font-semibold text-[var(--marquee)]">{movie.match} % pour vous</p>
      ) : movie.rating ? (
        <p className="text-xs text-[var(--mist)]">
          <span aria-hidden className="text-[var(--marquee)]">★ </span>
          {movie.rating.toFixed(1)}
          {movie.year ? <span className="ml-2">{movie.year}</span> : null}
        </p>
      ) : null}
    </div>
  );
}
