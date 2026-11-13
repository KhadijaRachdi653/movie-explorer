"use client";

import Link from "next/link";
import { PosterFan } from "./ListCover";
import { filmCount } from "./listUtils";
import { useApiData } from "./useApiData";

// Réponse de GET /api/collection?favorite=true (Module 4 — Collection personnelle, Amine)
type FavoritesResponse = { items: { movieId: number; title: string; posterUrl?: string | null }[] };

/**
 * Carte « Mes favoris » en lecture seule, qui mène vers la collection (Module 4).
 * Tant que le Module 4 n'est pas fusionné, son API n'existe pas : la carte reste masquée.
 */
export default function FavoritesCard() {
  const { data, error, loading } = useApiData<FavoritesResponse>("/api/collection?favorite=true");
  if (loading || error || !data) return null;

  const posters = data.items.map((m) => m.posterUrl).filter((u): u is string => Boolean(u)).slice(0, 3);

  return (
    <li>
      <Link href="/collection" className="group block" aria-label={`Mes favoris : ${filmCount(data.items.length)}. Ouvrir ma collection`}>
        <div className="relative overflow-hidden rounded-lg ring-1 ring-white/5 transition duration-300 group-hover:-translate-y-1 group-hover:ring-[var(--marquee)]/70 [&_img:nth-child(4)]:group-hover:-translate-x-[125%] [&_img:nth-child(5)]:group-hover:translate-x-[25%]">
          {posters.length > 0 ? (
            <PosterFan urls={posters} />
          ) : (
            <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_top,#2a1a10,var(--deep)_70%)] text-center">
              <span aria-hidden className="text-4xl text-[var(--marquee)]">♥</span>
              <span className="px-6 text-sm text-[var(--mist)]">Ajoutez des films en favori depuis votre collection</span>
            </div>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-xs font-medium text-[var(--ink)]/80 backdrop-blur">
            Ma collection
          </span>
        </div>
        <h3 className="mt-3 flex items-center gap-2 text-lg font-bold group-hover:text-[var(--marquee)]">
          <span aria-hidden className="text-[var(--marquee)]">♥</span> Mes favoris
        </h3>
        <p className="mt-0.5 text-sm text-[var(--mist)]">{filmCount(data.items.length)}</p>
      </Link>
    </li>
  );
}
