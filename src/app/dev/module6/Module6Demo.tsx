"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { CustomListDTO, RecommendationsResponse, RecommendedMovie, Visibility } from "@/modules/recommendations/types";

type LogEntry = { id: number; method: string; url: string; status: number; body: unknown };

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const input = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none";
const btn = "rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 disabled:opacity-50";
const btnPrimary = `${btn} bg-blue-600 text-white hover:bg-blue-500`;
const btnGhost = `${btn} border border-slate-700 text-slate-200 hover:bg-slate-800`;
const btnDanger = `${btn} border border-red-800 text-red-300 hover:bg-red-950`;

function statusColor(status: number) {
  if (status < 300) return "bg-emerald-900 text-emerald-200";
  if (status < 500) return "bg-amber-900 text-amber-200";
  return "bg-red-900 text-red-200";
}

export default function Module6Demo() {
  const [lists, setLists] = useState<CustomListDTO[]>([]);
  const [recos, setRecos] = useState<RecommendationsResponse | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [targetListId, setTargetListId] = useState("");

  // Appel API + ajout au journal (méthode, URL, code HTTP, réponse)
  const api = useCallback(async (url: string, method = "GET", body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    setLog((prev) => [{ id: Date.now() + Math.random(), method, url, status: res.status, body: data }, ...prev].slice(0, 10));
    return { ok: res.ok, status: res.status, data };
  }, []);

  const loadLists = useCallback(async () => {
    const r = await api("/api/lists");
    setNeedsLogin(r.status === 401);
    if (r.ok) setLists((r.data as { lists: CustomListDTO[] }).lists);
  }, [api]);

  const loadRecos = useCallback(async () => {
    const r = await api("/api/recommendations?limit=8");
    if (r.ok) setRecos(r.data as RecommendationsResponse);
  }, [api]);

  useEffect(() => {
    // Chargement initial des données (setState après un fetch asynchrone : cas légitime)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLists();
    void loadRecos();
  }, [loadLists, loadRecos]);

  // Liste cible valide (la première si la sélection n'existe plus)
  const targetId = lists.some((l) => l.id === targetListId) ? targetListId : (lists[0]?.id ?? "");

  async function refreshAll() {
    await loadLists();
    await loadRecos();
  }

  async function createList(form: HTMLFormElement) {
    const fd = new FormData(form);
    const r = await api("/api/lists", "POST", {
      name: String(fd.get("name") ?? ""),
      description: String(fd.get("description") ?? ""),
      visibility: fd.get("visibility") as Visibility,
    });
    if (r.ok) form.reset();
    await loadLists();
  }

  async function addRecoToList(movie: RecommendedMovie) {
    if (!targetId) return;
    await api(`/api/lists/${targetId}/movies`, "POST", {
      movieId: movie.movieId,
      title: movie.title,
      posterPath: movie.posterUrl ? movie.posterUrl.replace(TMDB_IMG, "") : null,
      genreIds: movie.genreIds,
    });
    await refreshAll();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/50 p-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-blue-500">Module 6 · Listes et recommandations</h1>
          <Link href="/" className="text-sm text-slate-300 underline hover:text-white">Retour à l’accueil</Link>
        </div>
      </header>

      {needsLogin && (
        <p className="mx-auto mt-4 max-w-6xl px-4 text-sm text-amber-300">
          Vous n’êtes pas connectée : les listes renvoient 401. <Link href="/login" className="underline">Se connecter</Link>
        </p>
      )}

      <main className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Créer une liste */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="mb-3 font-semibold">Créer une liste</h2>
            <form
              className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"
              onSubmit={(e) => { e.preventDefault(); void createList(e.currentTarget); }}
            >
              <input name="name" placeholder="Nom (ex. Mes films préférés)" className={input} aria-label="Nom de la liste" />
              <input name="description" placeholder="Description (facultatif)" className={input} aria-label="Description" />
              <select name="visibility" className={input} aria-label="Visibilité" defaultValue="private">
                <option value="private">Privée</option>
                <option value="public">Publique</option>
              </select>
              <button className={btnPrimary}>Créer</button>
            </form>
          </section>

          {/* Mes listes */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Mes listes ({lists.length})</h2>
              <button className={btnGhost} onClick={() => void loadLists()}>Actualiser</button>
            </div>
            {lists.length === 0 && !needsLogin && (
              <p className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                Aucune liste pour l’instant. Créez-en une ci-dessus.
              </p>
            )}
            {lists.map((list) => (
              <ListCard key={list.id} list={list} api={api} onChange={refreshAll} />
            ))}
          </section>

          {/* Recommandations */}
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">
                Recommandations{" "}
                {recos && <span className="ml-1 rounded bg-blue-950 px-2 py-0.5 text-xs text-blue-300">source : {recos.source}</span>}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {lists.length > 0 && (
                  <select className={`${input} w-auto`} value={targetId} onChange={(e) => setTargetListId(e.target.value)} aria-label="Liste où ajouter">
                    {lists.map((l) => <option key={l.id} value={l.id}>Ajouter dans : {l.name}</option>)}
                  </select>
                )}
                <button className={btnGhost} onClick={() => void loadRecos()}>Actualiser</button>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {recos?.results.map((m) => (
                <li key={m.movieId} className="flex flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                  {m.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.posterUrl} alt={`Affiche de ${m.title}`} className="aspect-[2/3] w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex aspect-[2/3] items-center justify-center bg-slate-800 text-xs text-slate-500">Pas d’affiche</div>
                  )}
                  <div className="flex flex-1 flex-col gap-1 p-2">
                    <p className="text-sm font-semibold leading-tight">{m.title}</p>
                    <p className="text-xs text-slate-400">★ {m.rating.toFixed(1)} · TMDB {m.movieId}</p>
                    {m.reason && <p className="text-xs text-blue-300">{m.reason}</p>}
                    <button className={`${btnGhost} mt-auto text-xs`} disabled={!targetId} onClick={() => void addRecoToList(m)}>
                      Ajouter à la liste
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Journal des appels API */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Appels à l’API</h2>
              <button className="text-xs text-slate-400 underline hover:text-white" onClick={() => setLog([])}>Effacer</button>
            </div>
            {log.length === 0 && <p className="text-sm text-slate-500">Chaque action apparaît ici avec son code HTTP.</p>}
            <ol className="space-y-2">
              {log.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-slate-800 bg-slate-950 p-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`rounded px-1.5 py-0.5 font-bold ${statusColor(entry.status)}`}>{entry.status}</span>
                    <span className="font-semibold">{entry.method}</span>
                    <span className="truncate text-slate-400">{entry.url}</span>
                  </div>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-slate-400">Réponse</summary>
                    <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[11px] text-slate-300">
                      {JSON.stringify(entry.body, null, 2)}
                    </pre>
                  </details>
                  {(entry.body as { error?: string } | null)?.error && (
                    <p className="mt-1 text-xs text-amber-300">{(entry.body as { error: string }).error}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </main>
    </div>
  );
}

type ApiFn = (url: string, method?: string, body?: unknown) => Promise<{ ok: boolean; status: number; data: unknown }>;

function ListCard({ list, api, onChange }: { list: CustomListDTO; api: ApiFn; onChange: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);

  async function save(form: HTMLFormElement) {
    const fd = new FormData(form);
    const r = await api(`/api/lists/${list.id}`, "PATCH", {
      name: String(fd.get("name") ?? ""),
      description: String(fd.get("description") ?? ""),
      visibility: fd.get("visibility") as Visibility,
    });
    if (r.ok) setEditing(false);
    await onChange();
  }

  async function addMovie(form: HTMLFormElement) {
    const fd = new FormData(form);
    const genreIds = String(fd.get("genreIds") ?? "")
      .split(",").map((g) => Number(g.trim())).filter((g) => Number.isInteger(g) && g > 0);
    const r = await api(`/api/lists/${list.id}/movies`, "POST", {
      movieId: Number(fd.get("movieId")),
      title: String(fd.get("title") ?? ""),
      genreIds,
    });
    if (r.ok) form.reset();
    await onChange();
  }

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      {editing ? (
        <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); void save(e.currentTarget); }}>
          <input name="name" defaultValue={list.name} className={input} aria-label="Nom" />
          <input name="description" defaultValue={list.description} className={input} aria-label="Description" />
          <select name="visibility" defaultValue={list.visibility} className={input} aria-label="Visibilité">
            <option value="private">Privée</option>
            <option value="public">Publique</option>
          </select>
          <div className="flex gap-2 sm:col-span-3">
            <button className={btnPrimary}>Enregistrer</button>
            <button type="button" className={btnGhost} onClick={() => setEditing(false)}>Annuler</button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold">
              {list.name}{" "}
              <span className={`ml-1 rounded px-2 py-0.5 text-xs ${list.visibility === "public" ? "bg-emerald-950 text-emerald-300" : "bg-slate-800 text-slate-300"}`}>
                {list.visibility === "public" ? "Publique" : "Privée"}
              </span>
            </h3>
            {list.description && <p className="text-sm text-slate-400">{list.description}</p>}
            <p className="mt-1 break-all text-xs text-slate-500">ID : {list.id} · {list.moviesCount} film(s)</p>
          </div>
          <div className="flex gap-2">
            <button className={btnGhost} onClick={() => setEditing(true)}>Modifier</button>
            <button className={btnDanger} onClick={async () => { await api(`/api/lists/${list.id}`, "DELETE"); await onChange(); }}>Supprimer</button>
          </div>
        </div>
      )}

      {list.movies.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-800 border-t border-slate-800">
          {list.movies.map((m) => (
            <li key={m.movieId} className="flex items-center gap-3 py-2">
              {m.posterPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${TMDB_IMG}${m.posterPath}`} alt="" className="h-12 w-8 rounded object-cover" />
              ) : (
                <div className="h-12 w-8 rounded bg-slate-800" />
              )}
              <span className="flex-1 text-sm">{m.title} <span className="text-xs text-slate-500">· TMDB {m.movieId}</span></span>
              <button className={`${btnDanger} text-xs`} onClick={async () => { await api(`/api/lists/${list.id}/movies/${m.movieId}`, "DELETE"); await onChange(); }}>
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="mt-3 grid gap-2 sm:grid-cols-[110px_1fr_140px_auto]" onSubmit={(e) => { e.preventDefault(); void addMovie(e.currentTarget); }}>
        <input name="movieId" placeholder="ID TMDB" inputMode="numeric" className={input} aria-label="Identifiant TMDB du film" />
        <input name="title" placeholder="Titre (ex. Fight Club)" className={input} aria-label="Titre du film" />
        <input name="genreIds" placeholder="Genres (ex. 18,53)" className={input} aria-label="Genres, séparés par des virgules" />
        <button className={btnGhost}>Ajouter le film</button>
      </form>
    </article>
  );
}
