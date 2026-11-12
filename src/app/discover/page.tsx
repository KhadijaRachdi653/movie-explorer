"use client";

// Module 5 — Movie Discovery : recherche de films + CRUD des recherches sauvegardées
// Interface mobile first : 1 colonne sur téléphone, grille plus large sur tablette / ordinateur.

import { useCallback, useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import FavoriteBadge from "@/components/collection/FavoriteBadge";

type SortOption = "popularity" | "rating" | "release_date" | "title";

interface Filters {
  query?: string;
  genre?: string;
  year?: number;
  minRating?: number;
  sortBy: SortOption;
}

interface Movie {
  movieId: string;
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
  id: string;
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
    ...(f.genre && { genre: f.genre }),
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
    genre: f.genre ?? "",
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

  const genreName = (id?: string) => genres.find((g) => g.id === id)?.name ?? id;

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
    "w-full rounded-md border border-[var(--edge)] bg-[var(--night)] px-3.5 py-2.5 text-base text-[var(--ink)] placeholder:text-[var(--mist)]/60 transition-colors focus:border-[var(--marquee)] focus:outline-none";
  const btn = "rounded-md px-4 py-2.5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const btnPrimary = `${btn} bg-[var(--marquee)] text-[#1a1203] hover:bg-[#f7c766]`;
  const btnGhost = `${btn} bg-white/10 hover:bg-white/20`;
  const chip = "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {!online && (
        <div role="status" className="border-b border-amber-600/40 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-200">
          Mode hors ligne : seules les recherches déjà consultées sont disponibles.
        </div>
      )}

      {/* En-tête de page + barre de recherche */}
      <section className="relative isolate overflow-hidden px-4 pb-8 pt-10 sm:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(242,181,68,0.14),transparent_55%)]" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Découvrir</h1>
            <p className="mt-2 text-[var(--mist)]">Recherchez par titre, filtrez par genre, année ou note, et sauvegardez vos recherches.</p>
          </div>
          <a href="#saved" className="text-sm font-semibold text-[var(--marquee)] hover:underline lg:hidden">Mes recherches sauvegardées</a>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-3" role="search">
          <div className="relative">
            <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[var(--mist)]">⌕</span>
            <input
              className="w-full rounded-full border border-[var(--edge)] bg-[var(--deep)] py-4 pl-12 pr-4 text-lg text-[var(--ink)] placeholder:text-[var(--mist)]/60 transition-colors focus:border-[var(--marquee)] focus:outline-none"
              placeholder="Rechercher un film par titre…"
              aria-label="Rechercher un film par titre"
              value={form.query}
              maxLength={100}
              onChange={(e) => setForm({ ...form, query: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]">
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
            <button type="submit" className={`${btnPrimary} col-span-1`} disabled={loading}>
              {loading ? "Recherche…" : "Rechercher"}
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => { setForm(EMPTY_FORM); runSearch({ sortBy: "popularity" }, 1); }}
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </section>

      <main className="grid gap-8 px-4 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ===== Résultats ===== */}
        <section className="min-w-0 space-y-6" aria-live="polite" aria-busy={loading}>
          {error && <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
          {loading && !data && (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5" aria-hidden>
              {Array.from({ length: 10 }, (_, i) => (
                <li key={i}><div className="skeleton aspect-[2/3] rounded-md" /><div className="skeleton mt-2 h-3 w-3/4 rounded" /></li>
              ))}
            </ul>
          )}
          {data && !error && (
            <>
              <p className="text-sm text-[var(--mist)]">
                <strong className="text-[var(--ink)]">{data.totalResults}</strong> résultat{data.totalResults > 1 ? "s" : ""}
                <span className="ml-2">{describe(activeFilters)}</span>
              </p>
              {data.isEmpty ? (
                <div className="rounded-xl border border-dashed border-[var(--edge)] p-10 text-center">
                  <p className="text-lg font-semibold">Aucun film trouvé</p>
                  <p className="mt-1 text-[var(--mist)]">{data.emptyMessage}</p>
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                  {data.results.map((m) => (
                    <li key={m.movieId}>
                      <Link href={`/movies/${m.movieId}`} className="group block" aria-label={`${m.title}${m.year ? `, ${m.year}` : ""}`}>
                        <div className="relative overflow-hidden rounded-md bg-[var(--deep)] ring-1 ring-white/5 transition duration-200 group-hover:-translate-y-1 group-hover:ring-[var(--marquee)]/70">
                          <FavoriteBadge movieId={m.movieId} />
                          {m.posterUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.posterUrl} alt="" loading="lazy" className="aspect-[2/3] w-full object-cover" />
                          ) : (
                            <div className="flex aspect-[2/3] items-end bg-gradient-to-br from-[var(--raised)] to-[var(--deep)] p-3">
                              <span className="line-clamp-3 text-sm font-semibold text-[var(--mist)]">{m.title}</span>
                            </div>
                          )}
                        </div>
                        <h3 className="mt-2 line-clamp-1 text-sm font-medium group-hover:text-[var(--marquee)]">{m.title}</h3>
                        <p className="text-xs text-[var(--mist)]">
                          <span aria-hidden className="text-[var(--marquee)]">★ </span>{m.rating.toFixed(1)}
                          {m.year ? <span className="ml-2">{m.year}</span> : null}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {data.totalPages > 1 && (
                <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-4">
                  <button className={`${chip} border border-[var(--edge)] px-4 py-2 text-sm hover:border-[var(--marquee)]`} disabled={page <= 1 || loading} onClick={() => runSearch(activeFilters, page - 1)}>
                    ‹ Précédent
                  </button>
                  <span className="px-2 text-sm text-[var(--mist)]">Page <strong className="text-[var(--ink)]">{page}</strong> sur {data.totalPages}</span>
                  <button className={`${chip} border border-[var(--edge)] px-4 py-2 text-sm hover:border-[var(--marquee)]`} disabled={page >= data.totalPages || loading} onClick={() => runSearch(activeFilters, page + 1)}>
                    Suivant ›
                  </button>
                </nav>
              )}
            </>
          )}
        </section>

        {/* ===== CRUD : recherches sauvegardées ===== */}
        <aside id="saved" className="h-fit scroll-mt-20 space-y-4 rounded-xl border border-[var(--edge)] bg-[var(--deep)] p-5 lg:sticky lg:top-20">
          <h2 className="text-xl font-bold">Mes recherches sauvegardées</h2>
          {crudMsg && (
            <p role="status" className={`rounded-md p-2.5 text-sm ${crudMsg.type === "ok" ? "border border-green-500/40 bg-green-500/10 text-green-300" : "border border-red-500/40 bg-red-500/10 text-red-300"}`}>
              {crudMsg.text}
            </p>
          )}
          {loggedIn === false && (
            <p className="text-sm text-[var(--mist)]">
              <Link href="/login" className="font-semibold text-[var(--marquee)] hover:underline">Connectez-vous</Link> pour sauvegarder vos recherches.
            </p>
          )}
          {loggedIn && (
            <>
              <form onSubmit={onSave} className="space-y-2">
                <p className="text-xs text-[var(--mist)]">Recherche affichée : {describe(activeFilters)}</p>
                <div className="flex gap-2">
                  <input
                    className={input}
                    placeholder="Nom (ex. Action 2020)"
                    aria-label="Nom de la recherche à sauvegarder"
                    value={saveName}
                    maxLength={50}
                    onChange={(e) => setSaveName(e.target.value)}
                    required
                    minLength={2}
                  />
                  <button type="submit" className={`${btnPrimary} shrink-0`} disabled={!online}>
                    Sauver
                  </button>
                </div>
              </form>
              {saved.length === 0 ? (
                <p className="text-sm text-[var(--mist)]">Aucune recherche sauvegardée.</p>
              ) : (
                <ul className="space-y-3">
                  {saved.map((s) => (
                    <li key={s.id} className="space-y-3 rounded-lg border border-[var(--edge)] bg-[var(--night)] p-3.5">
                      {editingId === s.id ? (
                        <div className="flex gap-2">
                          <input className={input} value={editName} maxLength={50} aria-label="Nouveau nom" onChange={(e) => setEditName(e.target.value)} autoFocus />
                          <button className={btnPrimary} onClick={() => onRename(s.id)}>OK</button>
                          <button className={btnGhost} aria-label="Annuler" onClick={() => setEditingId(null)}>✕</button>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          <p className="mt-0.5 text-xs text-[var(--mist)]">{describe(s.filters)}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        <button className={`${chip} bg-[var(--marquee)] text-[#1a1203] hover:bg-[#f7c766]`} onClick={() => onRun(s)}>Lancer</button>
                        <button className={`${chip} bg-white/10 hover:bg-white/20`} disabled={!online} onClick={() => { setEditingId(s.id); setEditName(s.name); }}>Renommer</button>
                        <button className={`${chip} bg-white/10 hover:bg-white/20`} disabled={!online} onClick={() => onUpdateFilters(s)} title="Remplacer ses filtres par la recherche affichée">Mettre à jour</button>
                        <button className={`${chip} border border-red-500/50 text-red-300 hover:bg-red-500/10`} disabled={!online} onClick={() => onDelete(s)}>Supprimer</button>
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
