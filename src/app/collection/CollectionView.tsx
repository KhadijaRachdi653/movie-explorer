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

  const buttonClass = (active: boolean) => `rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <section className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">Votre espace</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Ma collection</h1>
          <p className="max-w-2xl text-slate-400">Retrouvez vos films favoris et suivez ceux que vous souhaitez regarder, que vous regardez ou avez déjà vus.</p>
        </section>

        <nav className="flex flex-wrap gap-2" aria-label="Filtrer la collection">
          <button className={buttonClass(filter === "all")} onClick={() => setFilter("all")}>Tout</button>
          <button className={buttonClass(filter === "favorites")} onClick={() => setFilter("favorites")}>♥ Favoris</button>
          {COLLECTION_STATUSES.map((status) => (
            <button key={status} className={buttonClass(filter === status)} onClick={() => setFilter(status)}>{STATUS_LABEL[status]}</button>
          ))}
        </nav>

        {error && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">{error} {error.includes("Connectez-vous") && <Link className="underline" href="/login">Se connecter</Link>}</p>}
        {loading ? <p className="py-10 text-center text-slate-400">Chargement de votre collection…</p> : !error && items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-14 text-center">
            <p className="text-4xl" aria-hidden="true">🎞️</p>
            <h2 className="mt-4 text-xl font-semibold">Cette sélection est vide</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-400">Parcourez le catalogue pour ajouter un film à vos favoris ou à votre suivi.</p>
            <Link href="/discover" className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500">Découvrir des films</Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                {item.posterUrl ? <img src={item.posterUrl} alt={`Affiche du film ${item.title}`} loading="lazy" className="aspect-[2/3] w-full object-cover" /> : <div className="grid aspect-[2/3] place-items-center bg-slate-800 text-slate-500">Pas d’affiche</div>}
                <div className="flex flex-1 flex-col gap-3 p-3">
                  <div>
                    <h2 className="line-clamp-2 font-semibold">{item.title}</h2>
                    <p className="mt-1 text-xs text-slate-400">{item.year ?? "—"}{item.rating !== undefined ? ` · ⭐ ${item.rating.toFixed(1)}` : ""}</p>
                    {item.viewingCount > 0 && (
                      <div className="mt-2 rounded-md bg-slate-950/70 p-2 text-xs text-slate-300" aria-label={`Historique de visionnage de ${item.title}`}>
                        <p className="font-medium text-slate-200">{item.viewingCount} visionnage{item.viewingCount > 1 ? "s" : ""}</p>
                        <p className="mt-1 text-slate-400">Dernière fois : {item.lastWatchedAt ? formatViewingDate(item.lastWatchedAt) : "—"}</p>
                        {item.watchHistory.length > 1 && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-blue-300">Voir l&apos;historique</summary>
                            <ul className="mt-1 space-y-0.5">
                              {item.watchHistory.slice().reverse().map((date, index) => <li key={`${date}-${index}`}>{formatViewingDate(date)}</li>)}
                            </ul>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                  <label className="text-xs text-slate-400">
                    Suivi du film
                    <select aria-label={`Statut de ${item.title}`} value={item.status} disabled={busyItemId === item.id} onChange={(event) => void update(item.id, { status: event.target.value as CollectionStatus })} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white disabled:opacity-60">
                      {COLLECTION_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
                    </select>
                  </label>
                  <div className="mt-auto flex gap-2">
                    <button aria-pressed={item.favorite} disabled={busyItemId === item.id} onClick={() => void update(item.id, { favorite: !item.favorite })} className={`flex-1 rounded-md px-2 py-2 text-sm disabled:opacity-60 ${item.favorite ? "bg-pink-950 text-pink-300" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>{busyItemId === item.id ? "Mise à jour…" : item.favorite ? "♥ Favori" : "♡ Favori"}</button>
                    <button disabled={removingItemId === item.id} onClick={() => void remove(item)} className="rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-red-950 hover:text-red-200 disabled:opacity-60" aria-label={`Retirer ${item.title} de la collection`}>{removingItemId === item.id ? "Retrait…" : "Retirer"}</button>
                  </div>
                  {item.status === "watched" && (
                    <button
                      type="button"
                      disabled={busyItemId === item.id}
                      onClick={() => void recordRewatch(item)}
                      className="w-full rounded-md border border-blue-800 bg-blue-950/60 px-2 py-2 text-sm font-medium text-blue-200 hover:bg-blue-900/70 disabled:opacity-60"
                    >
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
