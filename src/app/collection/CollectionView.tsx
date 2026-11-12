"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { COLLECTION_STATUSES, type CollectionMovieDto, type CollectionStatus } from "@/modules/collection/collection.types";

const STATUS_LABEL: Record<CollectionStatus, string> = {
  planned: "À voir",
  watching: "En cours",
  watched: "Vu",
};

function formatViewingDate(isoDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(isoDate));
}

type Filter = "all" | "favorites" | CollectionStatus;
type SortOrder = "title-asc" | "newest" | "recently-watched";

async function callApi<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error ?? `Erreur ${response.status}`), { status: response.status });
  return data as T;
}

export default function CollectionPage() {
  const [items, setItems] = useState<CollectionMovieDto[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  const loadItems = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const query = filter === "favorites" ? "?favorite=true" : filter === "all" ? "" : `?status=${filter}`;
      const data = await callApi<{ items: CollectionMovieDto[] }>(`/api/collection${query}`);
      setItems(data.items);
    } catch (err) {
      const failure = err as Error & { status?: number };
      setError(failure.status === 401 ? "Connectez-vous pour consulter votre collection." : failure.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadItems(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadItems]);

  async function update(id: string, changes: { favorite?: boolean; status?: CollectionStatus }) {
    const previous = items;
    const existing = items.find((item) => item.id === id);
    const optimisticWatchedAt = changes.status === "watched" && existing?.status !== "watched" ? new Date().toISOString() : null;
    setBusyItemId(id);
    setError("");
    setItems((current) => current.flatMap((item) => {
      if (item.id !== id) return [item];
      const watchHistory = optimisticWatchedAt ? [...item.watchHistory, optimisticWatchedAt] : item.watchHistory;
      const updated = {
        ...item,
        ...changes,
        watchHistory,
        viewingCount: watchHistory.length,
        lastWatchedAt: watchHistory.at(-1) ?? null,
      };
      if (filter === "favorites" && !updated.favorite) return [];
      if (filter !== "all" && filter !== "favorites" && updated.status !== filter) return [];
      return [updated];
    }));
    try {
      const updated = await callApi<CollectionMovieDto>(`/api/collection/${id}`, "PATCH", changes);
      setItems((current) => current.map((item) => item.id === id ? updated : item));
    } catch (err) {
      setItems(previous);
      setError((err as Error).message);
    } finally {
      setBusyItemId(null);
    }
  }

  async function recordRewatch(item: CollectionMovieDto) {
    const previous = items;
    const optimisticWatchedAt = new Date().toISOString();
    setBusyItemId(item.id);
    setError("");
    setItems((current) => current.map((entry) => {
      if (entry.id !== item.id) return entry;
      const watchHistory = [...entry.watchHistory, optimisticWatchedAt];
      return { ...entry, watchHistory, viewingCount: watchHistory.length, lastWatchedAt: optimisticWatchedAt };
    }));
    try {
      const updated = await callApi<CollectionMovieDto>(`/api/collection/${item.id}/viewings`, "POST");
      setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
    } catch (err) {
      setItems(previous);
      setError((err as Error).message);
    } finally {
      setBusyItemId(null);
    }
  }

  async function remove(item: CollectionMovieDto) {
    if (!window.confirm(`Retirer « ${item.title} » de votre collection ?`)) return;
    const previous = items;
    setRemovingItemId(item.id);
    setError("");
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    try {
      await callApi(`/api/collection/${item.id}`, "DELETE");
    } catch (err) {
      setItems(previous);
      setError((err as Error).message);
    } finally {
      setRemovingItemId(null);
    }
  }

  const buttonClass = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
      active ? "border-[var(--marquee)] bg-[var(--marquee)] text-[#1a1203]" : "border-[var(--edge)] text-[var(--ink)]/85 hover:border-[var(--marquee)] hover:text-[var(--marquee)]"
    }`;
  const field = "w-full rounded-md border border-[var(--edge)] bg-[var(--night)] px-3.5 py-2.5 text-[var(--ink)] placeholder:text-[var(--mist)]/60 focus:border-[var(--marquee)] focus:outline-none";
  const normalizedSearch = search.trim().toLocaleLowerCase("fr");
  const visibleItems = items
    .filter((item) => item.title.toLocaleLowerCase("fr").includes(normalizedSearch))
    .slice()
    .sort((left, right) => {
      if (sortOrder === "title-asc") return left.title.localeCompare(right.title, "fr", { sensitivity: "base" });
      if (sortOrder === "recently-watched") {
        const leftDate = left.lastWatchedAt ? Date.parse(left.lastWatchedAt) : 0;
        const rightDate = right.lastWatchedAt ? Date.parse(right.lastWatchedAt) : 0;
        return rightDate - leftDate || right.createdAt.localeCompare(left.createdAt);
      }
      return right.createdAt.localeCompare(left.createdAt);
    });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <section className="relative isolate overflow-hidden px-4 pb-8 pt-10 sm:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(242,181,68,0.14),transparent_55%)]" />
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Ma collection</h1>
        <p className="mt-2 max-w-2xl text-[var(--mist)]">Vos favoris et le suivi des films que vous voulez voir, regardez ou avez déjà vus.</p>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <nav className="flex flex-wrap gap-2" aria-label="Filtrer la collection">
            <button className={buttonClass(filter === "all")} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Tout</button>
            <button className={buttonClass(filter === "favorites")} aria-pressed={filter === "favorites"} onClick={() => setFilter("favorites")}>♥ Favoris</button>
            {COLLECTION_STATUSES.map((status) => (
              <button key={status} className={buttonClass(filter === status)} aria-pressed={filter === status} onClick={() => setFilter(status)}>{STATUS_LABEL[status]}</button>
            ))}
          </nav>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label htmlFor="collection-search" className="relative sm:w-64">
              <span className="sr-only">Rechercher un film</span>
              <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mist)]">⌕</span>
              <input
                id="collection-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Titre du film…"
                className={`${field} rounded-full pl-9`}
              />
            </label>
            <label htmlFor="collection-sort" className="flex items-center gap-2 text-sm text-[var(--mist)]">
              <span className="shrink-0">Trier par</span>
              <select id="collection-sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className={`${field} rounded-full py-2`}>
                <option value="newest">Ajoutés récemment</option>
                <option value="title-asc">Titre (A–Z)</option>
                <option value="recently-watched">Vus récemment</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <main className="px-4 pb-20 sm:px-8">
        {error && (
          <p role="alert" className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error} {error.includes("Connectez-vous") && <Link className="font-semibold text-[var(--marquee)] underline" href="/login">Se connecter</Link>}
          </p>
        )}

        {loading ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => <li key={i}><div className="skeleton aspect-[2/3] rounded-md" /><div className="skeleton mt-2 h-3 w-3/4 rounded" /></li>)}
          </ul>
        ) : !error && visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--edge)] px-6 py-14 text-center">
            <p className="text-4xl" aria-hidden="true">🎞️</p>
            <h2 className="mt-4 text-xl font-bold">{items.length > 0 ? "Aucun film trouvé" : "Cette sélection est vide"}</h2>
            <p className="mx-auto mt-2 max-w-md text-[var(--mist)]">{items.length > 0 ? "Essayez un autre titre ou effacez votre recherche." : "Ouvrez la fiche d’un film pour l’ajouter à vos favoris ou à votre suivi."}</p>
            {items.length > 0 && search ? (
              <button type="button" onClick={() => setSearch("")} className="mt-6 rounded-md bg-[var(--marquee)] px-5 py-3 font-semibold text-[#1a1203] hover:bg-[#f7c766]">Effacer la recherche</button>
            ) : (
              <Link href="/movies" className="mt-6 inline-flex rounded-md bg-[var(--marquee)] px-5 py-3 font-semibold text-[#1a1203] hover:bg-[#f7c766]">Parcourir le catalogue</Link>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {visibleItems.map((item) => (
              <li key={item.id} className="flex flex-col">
                <Link href={`/movies/${item.movieId}`} className="group relative block overflow-hidden rounded-md bg-[var(--deep)] ring-1 ring-white/5 transition duration-200 hover:-translate-y-1 hover:ring-[var(--marquee)]/70">
                  {item.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.posterUrl} alt={`Affiche du film ${item.title}`} loading="lazy" className="aspect-[2/3] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[2/3] items-end bg-gradient-to-br from-[var(--raised)] to-[var(--deep)] p-3 text-sm text-[var(--mist)]">{item.title}</div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">{STATUS_LABEL[item.status]}</span>
                  {item.favorite && <span aria-label="Favori" className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-[var(--marquee)] text-[#1a1203]">♥</span>}
                </Link>

                <h2 className="mt-2 line-clamp-1 font-semibold">{item.title}</h2>
                <p className="text-xs text-[var(--mist)]">
                  {item.year ?? "—"}{item.rating !== undefined && <> · <span className="text-[var(--marquee)]">★</span> {item.rating.toFixed(1)}</>}
                </p>

                {item.viewingCount > 0 && (
                  <div className="mt-2 rounded-md border border-[var(--edge)] bg-[var(--deep)] p-2 text-xs" aria-label={`Historique de visionnage de ${item.title}`}>
                    <p className="font-semibold">{item.viewingCount} visionnage{item.viewingCount > 1 ? "s" : ""}</p>
                    <p className="mt-0.5 text-[var(--mist)]">Dernière fois : {item.lastWatchedAt ? formatViewingDate(item.lastWatchedAt) : "—"}</p>
                    {item.watchHistory.length > 1 && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-[var(--marquee)]">Voir l&apos;historique</summary>
                        <ul className="mt-1 space-y-0.5 text-[var(--mist)]">
                          {item.watchHistory.slice().reverse().map((date, index) => <li key={`${date}-${index}`}>{formatViewingDate(date)}</li>)}
                        </ul>
                      </details>
                    )}
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  <label className="block text-xs text-[var(--mist)]">
                    <span className="sr-only">Suivi du film</span>
                    <select aria-label={`Statut de ${item.title}`} value={item.status} disabled={busyItemId === item.id} onChange={(event) => void update(item.id, { status: event.target.value as CollectionStatus })} className={`${field} py-2 text-sm disabled:opacity-60`}>
                      {COLLECTION_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
                    </select>
                  </label>
                  <div className="flex gap-2">
                    <button aria-pressed={item.favorite} disabled={busyItemId === item.id} onClick={() => void update(item.id, { favorite: !item.favorite })} className={`flex-1 rounded-md px-2 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${item.favorite ? "bg-[var(--marquee)]/15 text-[var(--marquee)]" : "bg-white/10 hover:bg-white/20"}`}>
                      {busyItemId === item.id ? "…" : item.favorite ? "♥ Favori" : "♡ Favori"}
                    </button>
                    <button disabled={removingItemId === item.id} onClick={() => void remove(item)} className="rounded-md border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60" aria-label={`Retirer ${item.title} de la collection`}>
                      {removingItemId === item.id ? "…" : "Retirer"}
                    </button>
                  </div>
                  {item.status === "watched" && (
                    <button type="button" disabled={busyItemId === item.id} onClick={() => void recordRewatch(item)} className="w-full rounded-md border border-[var(--edge)] px-2 py-2 text-sm font-medium hover:border-[var(--marquee)] hover:text-[var(--marquee)] disabled:opacity-60">
                      {busyItemId === item.id ? "Enregistrement…" : "↻ Vu à nouveau aujourd’hui"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
