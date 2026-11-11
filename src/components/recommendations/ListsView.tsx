"use client";
/* eslint-disable @next/next/no-img-element -- images TMDB externes */

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CustomListDTO } from "@/modules/recommendations/types";
import AddMoviesDialog from "./AddMoviesDialog";
import FavoritesCard from "./FavoritesCard";
import ListCover from "./ListCover";
import ListFormDialog from "./ListFormDialog";
import SignInPrompt from "./SignInPrompt";
import { useStreaming } from "./context";
import { filmCount, listTopGenres, relativeDate } from "./listUtils";
import { TMDB_POSTER } from "./movie";
import { btnPrimary, btnSecondary, field } from "./ui";

type Filter = "all" | "public" | "private";
type Sort = "updated" | "name" | "size";

const SORTS: { value: Sort; label: string }[] = [
  { value: "updated", label: "Modifiées récemment" },
  { value: "name", label: "Nom" },
  { value: "size", label: "Nombre de films" },
];

export default function ListsView() {
  const { session, lists, listsLoaded, listsError, reloadLists } = useStreaming();
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState<CustomListDTO | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("updated");

  // Liste à la une : la dernière modifiée qui contient des films
  const featured = useMemo(
    () => [...lists].filter((l) => l.moviesCount > 0).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null,
    [lists]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");
    const filtered = lists.filter(
      (l) => (filter === "all" || l.visibility === filter) && (!q || l.name.toLocaleLowerCase("fr").includes(q))
    );
    return filtered.sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name, "fr") : sort === "size" ? b.moviesCount - a.moviesCount : b.updatedAt.localeCompare(a.updatedAt)
    );
  }, [lists, filter, query, sort]);

  const counts = { all: lists.length, public: lists.filter((l) => l.visibility === "public").length, private: lists.filter((l) => l.visibility === "private").length };

  if (session.status === "guest") {
    return <div className="pt-16"><SignInPrompt title="Vos listes de films" text="Connectez-vous pour créer des listes, y ranger vos films et recevoir des suggestions adaptées." /></div>;
  }

  return (
    <div className="pb-20">
      {listsLoaded && featured ? (
        <FeaturedList list={featured} onAdd={() => setAdding(featured)} />
      ) : (
        <div className="px-4 pt-28 sm:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Mes listes</h1>
        </div>
      )}

      <div className="px-4 sm:px-8">
        {listsError && lists.length > 0 && (
          <p role="alert" className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--edge)] bg-[var(--deep)] px-4 py-3 text-sm">
            <span>{listsError} Les listes affichées ne sont peut-être pas à jour.</span>
            <button type="button" className="font-semibold text-[var(--marquee)] underline-offset-4 hover:underline" onClick={() => void reloadLists()}>Réessayer</button>
          </p>
        )}

        {!listsLoaded ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" aria-hidden>
            {Array.from({ length: 3 }, (_, i) => (
              <li key={i}><div className="skeleton aspect-[16/10] rounded-lg" /><div className="skeleton mt-3 h-4 w-1/2 rounded" /></li>
            ))}
          </ul>
        ) : listsError && lists.length === 0 ? (
          <div role="alert" className="mt-16 max-w-xl">
            <h2 className="text-2xl font-bold">Vos listes n’ont pas pu être chargées</h2>
            <p className="mt-2 text-[var(--mist)]">{listsError}</p>
            <button type="button" className={`${btnPrimary} mt-6`} onClick={() => void reloadLists()}>Réessayer</button>
          </div>
        ) : lists.length === 0 ? (
          <div className="mt-16 max-w-xl">
            <h2 className="text-2xl font-bold">Créez votre première liste</h2>
            <p className="mt-2 text-[var(--mist)]">
              Une liste pour les soirées en famille, une autre pour vos classiques préférés… Rangez vos films comme vous le souhaitez,
              et chaque liste aura ses propres suggestions.
            </p>
            <button type="button" className={`${btnPrimary} mt-6`} onClick={() => setCreating(true)}>Créer une liste</button>
          </div>
        ) : (
          <>
            {/* Barre d'outils : filtre, recherche, tri */}
            <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-baseline gap-4">
                <h2 className="text-2xl font-bold">Toutes mes listes</h2>
                <span className="text-sm text-[var(--mist)]">{lists.length} sur 20</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div role="radiogroup" aria-label="Filtrer par visibilité" className="inline-flex rounded-full border border-[var(--edge)] p-1">
                  {(["all", "public", "private"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="radio"
                      aria-checked={filter === f}
                      onClick={() => setFilter(f)}
                      className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                        filter === f ? "bg-[var(--ink)] font-semibold text-[var(--night)]" : "text-[var(--mist)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {f === "all" ? "Toutes" : f === "public" ? "Publiques" : "Privées"} <span className="opacity-60">{counts[f]}</span>
                    </button>
                  ))}
                </div>
                <label className="relative sm:w-56">
                  <span className="sr-only">Rechercher une liste</span>
                  <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mist)]">⌕</span>
                  <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une liste" className={`${field} rounded-full py-2 pl-8`} />
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--mist)]">
                  <span className="shrink-0">Trier par</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${field} rounded-full py-2`}>
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="mt-12 text-center">
                <p className="text-[var(--mist)]">Aucune liste ne correspond {query.trim() ? `à « ${query.trim()} »` : "à ce filtre"}.</p>
                <button type="button" className={`${btnSecondary} mt-4`} onClick={() => { setQuery(""); setFilter("all"); }}>Afficher toutes les listes</button>
              </div>
            ) : (
              <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {lists.length < 20 && filter === "all" && !query.trim() && (
                  <li>
                    <button
                      type="button"
                      onClick={() => setCreating(true)}
                      className="group flex w-full items-center justify-center gap-3 rounded-lg border border-dashed py-5 sm:aspect-[16/10] sm:flex-col sm:py-0 border-[var(--edge)] text-[var(--mist)] transition-colors hover:border-[var(--marquee)] hover:text-[var(--ink)]"
                    >
                      <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-white/5 text-2xl transition-colors group-hover:bg-[var(--marquee)] group-hover:text-[#1a1203]">+</span>
                      <span className="font-semibold">Nouvelle liste</span>
                    </button>
                  </li>
                )}
                {/* Favoris (Module 4) : seulement sans filtre ni recherche, car ce n'est pas une liste */}
                {filter === "all" && !query.trim() && <FavoritesCard />}
                {visible.map((l) => <ListCard key={l.id} list={l} />)}
              </ul>
            )}
          </>
        )}
      </div>

      <ListFormDialog open={creating} onClose={() => setCreating(false)} />
      {adding && <AddMoviesDialog list={lists.find((l) => l.id === adding.id) ?? adding} open onClose={() => setAdding(null)} />}
    </div>
  );
}

// Grande bannière : la dernière liste modifiée
function FeaturedList({ list, onAdd }: { list: CustomListDTO; onAdd: () => void }) {
  const cover = [...list.movies].reverse().find((m) => m.posterPath)?.posterPath;
  const genres = listTopGenres(list, 3);
  return (
    <section className="relative isolate overflow-hidden px-4 pb-12 pt-28 sm:px-8" aria-label="Dernière liste modifiée">
      {cover && <img src={`${TMDB_POSTER}${cover}`} alt="" className="absolute inset-0 -z-20 size-full scale-125 object-cover opacity-30 blur-3xl" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--night)]/40 via-[var(--night)]/70 to-[var(--night)]" />
      <h1 className="text-sm font-semibold text-[var(--mist)]">Mes listes</h1>
      <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1fr_minmax(0,520px)]">
        <div className="max-w-2xl">
          <p className="text-sm text-[var(--marquee)]">Modifiée {relativeDate(list.updatedAt)}</p>
          <h2 className="mt-2 text-balance text-[clamp(2.2rem,5vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">{list.name}</h2>
          {list.description && <p className="mt-4 max-w-xl text-[var(--ink)]/85">{list.description}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--mist)]">
            <span>{filmCount(list.moviesCount)}</span>
            <span>{list.visibility === "public" ? "Publique" : "Privée"}</span>
            {genres.map((g) => <span key={g} className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-[var(--ink)]/85">{g}</span>)}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/lists/${list.id}`} className={`${btnPrimary} py-3 sm:px-6 sm:text-base`}>Ouvrir la liste</Link>
            <button type="button" className={`${btnSecondary} py-3 sm:px-6 sm:text-base`} onClick={onAdd}>
              <span aria-hidden className="text-lg leading-none">+</span> Ajouter des films
            </button>
          </div>
        </div>
        <Link href={`/lists/${list.id}`} className="hidden overflow-hidden rounded-xl shadow-2xl shadow-black/50 ring-1 ring-white/10 lg:block" tabIndex={-1} aria-hidden>
          <ListCover list={list} />
        </Link>
      </div>
    </section>
  );
}

function ListCard({ list }: { list: CustomListDTO }) {
  const genres = listTopGenres(list);
  return (
    <li>
      <Link href={`/lists/${list.id}`} className="group block">
        <div className="relative overflow-hidden rounded-lg ring-1 ring-white/5 transition duration-300 group-hover:-translate-y-1 group-hover:ring-[var(--marquee)]/70 [&_img:nth-child(4)]:group-hover:-translate-x-[125%] [&_img:nth-child(5)]:group-hover:translate-x-[25%]">
          <ListCover list={list} />
          <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur ${list.visibility === "public" ? "bg-[var(--marquee)]/20 text-[var(--marquee)]" : "bg-black/50 text-[var(--ink)]/80"}`}>
            {list.visibility === "public" ? "Publique" : "Privée"}
          </span>
        </div>
        <h3 className="mt-3 truncate text-lg font-bold group-hover:text-[var(--marquee)]">{list.name}</h3>
        <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-[var(--mist)]">
          <span>{filmCount(list.moviesCount)}</span>
          <span>Modifiée {relativeDate(list.updatedAt)}</span>
        </p>
        {genres.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-1.5">
            {genres.map((g) => <span key={g} className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-[var(--ink)]/75">{g}</span>)}
          </p>
        )}
      </Link>
    </li>
  );
}
