"use client";

// Module 5 — Movie Discovery : recherche de films + CRUD des recherches sauvegardées
// Interface mobile first : 1 colonne sur téléphone, grille plus large sur tablette / ordinateur.

import { useCallback, useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";

type SortOption = "popularity" | "rating" | "release_date" | "title";

interface Filters {
  query?: string;
  genre?: number;
  year?: number;
  minRating?: number;
  sortBy: SortOption;
}

interface Movie {
  movieId: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  year: number | null;
  rating: number;
}

interface SearchResponse {
  results: Movie[];
  page: number;
  totalPages: number;
  totalResults: number;
  isEmpty: boolean;
  emptyMessage: string | null;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: Filters;
}

interface Genre {
  id: number;
  name: string;
}

const SORT_LABELS: Record<SortOption, string> = {
  popularity: "Popularité",
  rating: "Note",
  release_date: "Date de sortie",
  title: "Titre (A → Z)",
};

const EMPTY_FORM = { query: "", genre: "", year: "", minRating: "", sortBy: "popularity" as SortOption };
type FormState = typeof EMPTY_FORM;

// Formulaire (texte) -> filtres de l'API (seuls les champs remplis)
function toFilters(f: FormState): Filters {
  return {
    ...(f.query.trim() && { query: f.query.trim() }),
    ...(f.genre && { genre: Number(f.genre) }),
    ...(f.year && { year: Number(f.year) }),
    ...(f.minRating && { minRating: Number(f.minRating) }),
    sortBy: f.sortBy,
  };
}

// Statut en ligne / hors ligne du navigateur (PWA)
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

function toForm(f: Filters): FormState {
  return {
    query: f.query ?? "",
    genre: f.genre ? String(f.genre) : "",
    year: f.year ? String(f.year) : "",
    minRating: f.minRating !== undefined ? String(f.minRating) : "",
    sortBy: f.sortBy ?? "popularity",
  };
}

// Appel API JSON : renvoie les données, ou lève une erreur avec le message de l'API
async function callApi<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Erreur ${res.status}`), { status: res.status });
  return data as T;
}

export default function DiscoverPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Filters>({ sortBy: "popularity" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

  // CRUD
  const [saved, setSaved] = useState<SavedSearch[]>([]);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [saveName, setSaveName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [crudMsg, setCrudMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const genreName = (id?: number) => genres.find((g) => g.id === id)?.name ?? `Genre ${id}`;

  // ---- Recherche (GET /api/search) ----
  // fetchSearch ne modifie l'état qu'après la réponse ; runSearch affiche aussi le chargement
  const fetchSearch = useCallback(async (filters: Filters, p: number) => {
    const params = new URLSearchParams();
    Object.entries({ ...filters, page: p }).forEach(([k, v]) => v !== undefined && params.set(k, String(v)));
    try {
      const res = await fetch(`/api/search?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setError("");
      setData(json);
      setActiveFilters(filters);
      setPage(p);
    } catch (e) {
      setError(
        navigator.onLine
          ? (e as Error).message || "Erreur lors de la recherche."
          : "Vous êtes hors ligne : cette recherche n'est pas disponible en cache."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const runSearch = useCallback(
    (filters: Filters, p: number) => {
      setLoading(true);
      setError("");
      return fetchSearch(filters, p);
    },
    [fetchSearch]
  );

  // ---- R : liste des recherches sauvegardées ----
  const loadSaved = useCallback(async () => {
    try {
      const json = await callApi<{ savedSearches: SavedSearch[] }>("/api/saved-searches");
      setSaved(json.savedSearches);
      setLoggedIn(true);
    } catch (e) {
      if ((e as { status?: number }).status === 401) setLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/search/genres")
      .then((r) => r.json())
      .then((j) => setGenres(j.genres ?? []))
      .catch(() => {});
    // chargement initial : films populaires + recherches sauvegardées (l'état n'est modifié qu'après la réponse réseau)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSearch({ sortBy: "popularity" }, 1);
    loadSaved();
  }, [fetchSearch, loadSaved]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    runSearch(toFilters(form), 1);
  }

  function flash(type: "ok" | "err", text: string) {
    setCrudMsg({ type, text });
    setTimeout(() => setCrudMsg(null), 4000);
  }

  // ---- C : sauvegarder la recherche affichée ----
  async function onSave(e: FormEvent) {
    e.preventDefault();
    try {
      await callApi("/api/saved-searches", "POST", { name: saveName, filters: activeFilters });
      setSaveName("");
      flash("ok", "Recherche sauvegardée.");
      loadSaved();
    } catch (err) {
      flash("err", (err as Error).message);
    }
  }

  // ---- R : relancer une recherche sauvegardée ----
  function onRun(s: SavedSearch) {
    setForm(toForm(s.filters));
    runSearch(s.filters, 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---- U : renommer ----
  async function onRename(id: string) {
    try {
      await callApi(`/api/saved-searches/${id}`, "PATCH", { name: editName });
      setEditingId(null);
      flash("ok", "Recherche renommée.");
      loadSaved();
    } catch (err) {
      flash("err", (err as Error).message);
    }
  }

  // ---- U : remplacer les filtres par ceux de la recherche affichée ----
  async function onUpdateFilters(s: SavedSearch) {
    try {
      await callApi(`/api/saved-searches/${s.id}`, "PATCH", { filters: activeFilters });
      flash("ok", `Filtres de « ${s.name} » mis à jour.`);
      loadSaved();
    } catch (err) {
      flash("err", (err as Error).message);
    }
  }

  // ---- D : supprimer ----
  async function onDelete(s: SavedSearch) {
    if (!window.confirm(`Supprimer la recherche « ${s.name} » ?`)) return;
    try {
      await callApi(`/api/saved-searches/${s.id}`, "DELETE");
      flash("ok", "Recherche supprimée.");
      loadSaved();
    } catch (err) {
      flash("err", (err as Error).message);
    }
  }

  function describe(f: Filters) {
    const parts = [
      f.query && `« ${f.query} »`,
      f.genre && genreName(f.genre),
      f.year && String(f.year),
      f.minRating !== undefined && `≥ ${f.minRating}/10`,
      `tri : ${SORT_LABELS[f.sortBy] ?? f.sortBy}`,
    ];
    return parts.filter(Boolean).join(" · ");
  }

  const input =
    "w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 text-base text-white placeholder-slate-500 focus:outline-none focus:border-blue-500";
  const btn = "rounded-lg px-4 py-2.5 font-semibold transition-colors disabled:opacity-50";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-blue-500">🎬 Movie Explorer</Link>
        <a href="#saved" className="text-sm text-blue-400 underline lg:hidden">Mes recherches ↓</a>
        <span className="hidden lg:inline text-sm text-slate-400">Découvrir</span>
      </header>

      {!online && (
        <div className="bg-amber-500/15 border-b border-amber-600/40 text-amber-200 text-sm px-4 py-2 text-center">
          Mode hors ligne : seules les recherches déjà consultées sont disponibles.
        </div>
      )}

      <main className="mx-auto max-w-6xl p-4 space-y-6 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:space-y-0">
        {/* ===== Recherche ===== */}
        <section className="space-y-4 min-w-0">
          <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-slate-900/60 border border-slate-800 p-4">
            <input
              className={input}
              placeholder="Rechercher un film par titre…"
              value={form.query}
              maxLength={100}
              onChange={(e) => setForm({ ...form, query: e.target.value })}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select className={input} value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} aria-label="Genre">
                <option value="">Tous genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <input
                className={input}
                type="number"
                placeholder="Année"
                min={1900}
                max={new Date().getFullYear() + 5}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                aria-label="Année"
              />
              <select className={input} value={form.minRating} onChange={(e) => setForm({ ...form, minRating: e.target.value })} aria-label="Note minimale">
                <option value="">Toutes notes</option>
                {[5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>≥ {n}/10</option>
                ))}
              </select>
              <select className={input} value={form.sortBy} onChange={(e) => setForm({ ...form, sortBy: e.target.value as SortOption })} aria-label="Tri">
                {Object.entries(SORT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className={`${btn} flex-1 bg-blue-600 hover:bg-blue-700`} disabled={loading}>
                {loading ? "Recherche…" : "Rechercher"}
              </button>
              <button
                type="button"
                className={`${btn} bg-slate-800 hover:bg-slate-700`}
                onClick={() => { setForm(EMPTY_FORM); runSearch({ sortBy: "popularity" }, 1); }}
              >
                Réinitialiser
              </button>
            </div>
          </form>

          {error && <p className="rounded-lg bg-red-950/50 border border-red-800 text-red-300 p-3 text-sm">{error}</p>}

          {data && !error && (
            <>
              <p className="text-sm text-slate-400">
                {data.totalResults} résultat{data.totalResults > 1 ? "s" : ""} · {describe(activeFilters)}
              </p>

              {data.isEmpty ? (
                <p className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-slate-400">{data.emptyMessage}</p>
              ) : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {data.results.map((m) => (
                    <li key={m.movieId} className="rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex flex-col">
                      {m.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.posterUrl} alt={m.title} loading="lazy" className="aspect-[2/3] w-full object-cover" />
                      ) : (
                        <div className="aspect-[2/3] w-full grid place-items-center bg-slate-800 text-slate-500 text-sm">Pas d&apos;affiche</div>
                      )}
                      <div className="p-2 space-y-1">
                        <h3 className="text-sm font-semibold leading-tight line-clamp-2">{m.title}</h3>
                        <p className="text-xs text-slate-400">
                          {m.year ?? "—"} · ⭐ {m.rating.toFixed(1)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {data.totalPages > 1 && (
                <nav className="flex items-center justify-center gap-3 pt-2">
                  <button className={`${btn} bg-slate-800 hover:bg-slate-700`} disabled={page <= 1 || loading} onClick={() => runSearch(activeFilters, page - 1)}>
                    ← Précédent
                  </button>
                  <span className="text-sm text-slate-400">Page {page} / {data.totalPages}</span>
                  <button className={`${btn} bg-slate-800 hover:bg-slate-700`} disabled={page >= data.totalPages || loading} onClick={() => runSearch(activeFilters, page + 1)}>
                    Suivant →
                  </button>
                </nav>
              )}
            </>
          )}
        </section>

        {/* ===== CRUD : recherches sauvegardées ===== */}
        <aside id="saved" className="scroll-mt-20 space-y-3 rounded-xl bg-slate-900/60 border border-slate-800 p-4 h-fit lg:sticky lg:top-20">
          <h2 className="text-lg font-bold">Mes recherches sauvegardées</h2>

          {crudMsg && (
            <p className={`rounded-lg p-2 text-sm ${crudMsg.type === "ok" ? "bg-emerald-950/60 text-emerald-300" : "bg-red-950/60 text-red-300"}`}>
              {crudMsg.text}
            </p>
          )}

          {loggedIn === false && (
            <p className="text-sm text-slate-400">
              <Link href="/login" className="text-blue-400 underline">Connectez-vous</Link> pour sauvegarder vos recherches.
            </p>
          )}

          {loggedIn && (
            <>
              <form onSubmit={onSave} className="space-y-2">
                <p className="text-xs text-slate-400">Recherche affichée : {describe(activeFilters)}</p>
                <div className="flex gap-2">
                  <input
                    className={input}
                    placeholder="Nom (ex. Action 2020)"
                    value={saveName}
                    maxLength={50}
                    onChange={(e) => setSaveName(e.target.value)}
                    required
                    minLength={2}
                  />
                  <button type="submit" className={`${btn} bg-emerald-600 hover:bg-emerald-700 shrink-0`} disabled={!online}>
                    Sauver
                  </button>
                </div>
              </form>

              {saved.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune recherche sauvegardée.</p>
              ) : (
                <ul className="space-y-2">
                  {saved.map((s) => (
                    <li key={s.id} className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-2">
                      {editingId === s.id ? (
                        <div className="flex gap-2">
                          <input className={input} value={editName} maxLength={50} onChange={(e) => setEditName(e.target.value)} autoFocus />
                          <button className={`${btn} bg-blue-600 hover:bg-blue-700`} onClick={() => onRename(s.id)}>OK</button>
                          <button className={`${btn} bg-slate-800`} onClick={() => setEditingId(null)}>✕</button>
                        </div>
                      ) : (
                        <>
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-xs text-slate-400">{describe(s.filters)}</p>
                        </>
                      )}
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        <button className="rounded bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5" onClick={() => onRun(s)}>Lancer</button>
                        <button className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5" disabled={!online} onClick={() => { setEditingId(s.id); setEditName(s.name); }}>Renommer</button>
                        <button className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5" disabled={!online} onClick={() => onUpdateFilters(s)} title="Remplacer ses filtres par la recherche affichée">Mettre à jour</button>
                        <button className="rounded bg-red-700/80 hover:bg-red-700 px-2.5 py-1.5" disabled={!online} onClick={() => onDelete(s)}>Supprimer</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </aside>
      </main>
    </div>
  );
}
