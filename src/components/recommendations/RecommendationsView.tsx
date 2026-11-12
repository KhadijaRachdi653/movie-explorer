"use client";

import { useState } from "react";
import Link from "next/link";
import type { RecommendationsResponse } from "@/modules/recommendations/types";
import Hero from "./Hero";
import ListFormDialog from "./ListFormDialog";
import ListRecoRow from "./ListRecoRow";
import MovieRow from "./MovieRow";
import Top10Row from "./Top10Row";
import { useStreaming } from "./context";
import { genreRow } from "./genres";
import { fromRecommended, type CardMovie } from "./movie";
import { useApiData } from "./useApiData";
import { btnPrimary, btnSecondary } from "./ui";

const MIN_ROW = 4; // une rangée de genre n'apparaît qu'avec au moins 4 films

// Rangées par genre : chaque film va dans le genre le plus représenté parmi les siens
function groupByGenre(movies: CardMovie[]): { genre: string; movies: CardMovie[] }[] {
  const count = new Map<string, number>();
  for (const m of movies) for (const g of m.genres) count.set(g, (count.get(g) ?? 0) + 1);
  const ranked = [...count.entries()].sort((a, b) => b[1] - a[1]).map(([g]) => g);

  const rows = new Map<string, CardMovie[]>();
  for (const m of movies) {
    const g = ranked.find((name) => m.genres.includes(name));
    if (g !== undefined) rows.set(g, [...(rows.get(g) ?? []), m]);
  }
  return ranked
    .filter((g) => (rows.get(g)?.length ?? 0) >= MIN_ROW)
    .slice(0, 4)
    .map((g) => ({ genre: g, movies: rows.get(g)! }));
}

export default function RecommendationsView() {
  const { session, lists } = useStreaming();
  const personal = useApiData<RecommendationsResponse>("/api/recommendations?limit=40");
  const trending = useApiData<RecommendationsResponse>("/api/recommendations?trending=true&limit=20");
  const [creating, setCreating] = useState(false);

  const isPersonal = personal.data?.source === "personal";
  const movies = personal.data?.results.map(fromRecommended) ?? [];
  const featured = movies.filter((m) => m.backdropUrl).slice(0, 5);
  const top10 = movies.slice(0, 10);
  const genreRows = isPersonal ? groupByGenre(movies.slice(10)) : [];
  const listsWithMovies = lists.filter((l) => l.moviesCount > 0).slice(0, 4);

  if (personal.error) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-16 pt-32 text-center">
        <h1 className="text-2xl font-bold">Les recommandations n’ont pas pu être chargées</h1>
        <p className="mt-2 text-[var(--mist)]">{personal.error.message}</p>
        <button type="button" className={`${btnPrimary} mt-6`} onClick={personal.reload}>Réessayer</button>
      </div>
    );
  }

  return (
    <>
      <Hero movies={featured.length > 0 ? featured : movies.slice(0, 1)} loading={personal.loading} />

      {!personal.loading && !isPersonal && (
        <aside className="mx-4 -mt-6 mb-10 rounded-lg border border-[var(--edge)] bg-[var(--deep)] p-5 sm:mx-8 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="font-bold">
              {session.status === "user" ? "Vos suggestions commencent avec une liste" : "Des suggestions qui vous ressemblent"}
            </h2>
            <p className="mt-1 text-sm text-[var(--mist)]">
              {session.status === "user"
                ? "Ajoutez quelques films que vous aimez à une liste : les recommandations s’adapteront à vos goûts."
                : "Connectez-vous et rangez vos films dans des listes pour recevoir des recommandations personnalisées."}
            </p>
          </div>
          {session.status === "user" ? (
            <button type="button" className={`${btnSecondary} mt-4 shrink-0 sm:mt-0`} onClick={() => setCreating(true)}>Créer une liste</button>
          ) : (
            <Link href="/login" className={`${btnPrimary} mt-4 shrink-0 sm:mt-0`}>Se connecter</Link>
          )}
        </aside>
      )}

      <div className={`space-y-10 pb-20 ${isPersonal ? "relative sm:-mt-10" : ""}`}>
        {personal.loading ? (
          <MovieRow title="Chargement des recommandations" movies={[]} loading />
        ) : (
          <Top10Row title={isPersonal ? "Top 10 pour vous" : "Top 10 des spectateurs"} movies={top10} />
        )}
        {genreRows.map((r) => (
          <MovieRow key={r.genre} title={genreRow(r.genre)} movies={r.movies} />
        ))}
        {listsWithMovies.map((l) => (
          <ListRecoRow key={l.id} listId={l.id} title={`Inspiré de votre liste « ${l.name} »`} />
        ))}
        {isPersonal && (
          <MovieRow title="Les mieux notés" movies={trending.data?.results.map(fromRecommended) ?? []} loading={trending.loading} />
        )}
      </div>

      <ListFormDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
