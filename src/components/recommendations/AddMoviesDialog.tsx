"use client";

import { useEffect, useState } from "react";
import type { CustomListDTO, RecommendationsResponse } from "@/modules/recommendations/types";
import Dialog from "./Dialog";
import MovieCard from "./MovieCard";
import { apiFetch, ApiClientError } from "./api";
import { useStreaming } from "./context";
import { fromRecommended, type CardMovie } from "./movie";
import { field } from "./ui";

// Résultat de GET /api/search (Module 5 — Découverte)
type SearchResult = { results: { movieId: number; title: string; posterUrl: string | null; overview?: string; rating?: number; year?: number | null; genreIds: number[] }[] };

// Ajouter des films à une liste : recherche par titre + suggestions basées sur la liste
export default function AddMoviesDialog({ list, open, onClose }: { list: CustomListDTO; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="add-movies-title" wide>
      {open && <AddMoviesPanel list={list} onClose={onClose} />}
    </Dialog>
  );
}

function AddMoviesPanel({ list, onClose }: { list: CustomListDTO; onClose: () => void }) {
  const { addMovie } = useStreaming();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardMovie[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchUnavailable, setSearchUnavailable] = useState(false);
  const [suggestions, setSuggestions] = useState<CardMovie[]>([]);

  // Suggestions affichées tant qu'aucune recherche n'est saisie
  useEffect(() => {
    let cancelled = false;
    apiFetch<RecommendationsResponse>(`/api/recommendations?listId=${list.id}&limit=18`)
      .then((r) => { if (!cancelled) setSuggestions(r.results.map(fromRecommended)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [list.id]);

  // Recherche avec un léger délai pendant la frappe
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await apiFetch<SearchResult>(`/api/search?query=${encodeURIComponent(q)}`);
        if (!cancelled) setResults(data.results.map((m) => ({ ...m, genreIds: m.genreIds ?? [] })));
      } catch (err) {
        if (!cancelled && err instanceof ApiClientError && err.status === 404) setSearchUnavailable(true);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const showSearch = query.trim().length >= 2 && !searchUnavailable;
  const movies = showSearch ? results ?? [] : suggestions;

  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="add-movies-title" className="text-xl font-bold">Ajouter des films</h2>
          <p className="text-sm text-[var(--mist)]">à {list.name}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-[var(--mist)] hover:bg-white/5 hover:text-[var(--ink)]">Terminé</button>
      </div>

      <label htmlFor="movie-search" className="sr-only">Rechercher un film par titre</label>
      <input
        id="movie-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un film par titre"
        className={`${field} mt-4 py-3 text-base`}
        autoFocus
      />
      {searchUnavailable && (
        <p className="mt-2 text-xs text-[var(--mist)]">La recherche arrive avec le module Découverte. En attendant, choisissez parmi les suggestions.</p>
      )}

      <h3 className="mb-3 mt-5 text-sm font-semibold text-[var(--mist)]">
        {showSearch ? (searching ? "Recherche…" : `${movies.length} résultat${movies.length > 1 ? "s" : ""}`) : "Suggestions pour cette liste"}
      </h3>
      {showSearch && !searching && movies.length === 0 && (
        <p className="py-6 text-center text-sm text-[var(--mist)]">Aucun film trouvé pour « {query.trim()} ». Vérifiez l’orthographe ou essayez un autre titre.</p>
      )}
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {movies.map((m) => {
          const inList = list.movieIds.includes(m.movieId);
          return (
            <li key={m.movieId}>
              <MovieCard
                movie={m}
                listId={list.id}
                quickAction={{
                  label: inList ? `${m.title} est déjà dans la liste` : `Ajouter ${m.title} à ${list.name}`,
                  icon: "+",
                  done: inList,
                  onClick: (movie) => void addMovie(list.id, movie),
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
