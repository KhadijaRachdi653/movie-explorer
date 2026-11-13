"use client";

import { useFavoriteIds } from "./favorites";

// Cœur affiché sur l'affiche d'un film mis en favori (Module 4)
export default function FavoriteBadge({ movieId, className = "left-2 top-2" }: { movieId: string; className?: string }) {
  const favorites = useFavoriteIds();
  if (!favorites.has(movieId)) return null;
  return (
    <span
      role="img"
      aria-label="Dans vos favoris"
      title="Dans vos favoris"
      className={`pointer-events-none absolute z-10 flex size-8 items-center justify-center rounded-full bg-[var(--marquee)] text-sm text-[#1a1203] shadow-lg shadow-black/50 ${className}`}
    >
      ♥
    </span>
  );
}
