import { tmdbFetch, posterUrl, type TmdbMovie, type TmdbPage } from "@/lib/tmdb";
import type { SearchQuery } from "./discovery.schema";
import type { DiscoveryMovie, Genre, SearchResponse, SortOption } from "./discovery.types";

type TmdbMovieFull = TmdbMovie & { popularity?: number; vote_count?: number };

// Correspondance tri app -> tri TMDB (/discover)
const TMDB_SORT: Record<SortOption, string> = {
  popularity: "popularity.desc",
  rating: "vote_average.desc",
  release_date: "primary_release_date.desc",
  title: "title.asc",
};

function toDiscoveryMovie(m: TmdbMovieFull): DiscoveryMovie {
  return {
    movieId: m.id,
    title: m.title,
    overview: m.overview ?? "",
    posterUrl: posterUrl(m.poster_path),
    releaseDate: m.release_date || null,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    rating: m.vote_average ?? 0,
    voteCount: m.vote_count ?? 0,
    genreIds: m.genre_ids ?? [],
  };
}

// Tri local (utilisé en mode recherche par titre, que TMDB ne sait pas trier)
function sortLocally(movies: TmdbMovieFull[], sortBy: SortOption): TmdbMovieFull[] {
  const sorted = [...movies];
  switch (sortBy) {
    case "rating":
      return sorted.sort((a, b) => b.vote_average - a.vote_average);
    case "release_date":
      return sorted.sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""));
    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title, "fr"));
    default:
      return sorted.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }
}

function buildEmptyMessage(q: SearchQuery): string {
  if (q.query) return `Aucun film ne correspond à « ${q.query} ». Vérifiez l'orthographe ou retirez des filtres.`;
  return "Aucun film ne correspond à ces filtres. Essayez d'élargir vos critères.";
}

/**
 * Recherche / découverte de films.
 * - Avec `query`  : TMDB /search/movie (titre + année), puis genre, note et tri appliqués sur la page reçue.
 * - Sans `query`  : TMDB /discover/movie (tous les filtres et le tri sont faits par TMDB).
 */
export async function searchMovies(q: SearchQuery): Promise<SearchResponse> {
  let data: TmdbPage<TmdbMovieFull>;
  let movies: TmdbMovieFull[];

  if (q.query) {
    data = await tmdbFetch<TmdbPage<TmdbMovieFull>>("/search/movie", {
      query: q.query,
      page: q.page,
      include_adult: "false",
      ...(q.year && { primary_release_year: q.year }),
    });
    movies = data.results
      .filter((m) => (q.genre ? m.genre_ids?.includes(q.genre) : true))
      .filter((m) => (q.minRating !== undefined ? m.vote_average >= q.minRating : true));
    movies = sortLocally(movies, q.sortBy);
  } else {
    data = await tmdbFetch<TmdbPage<TmdbMovieFull>>("/discover/movie", {
      page: q.page,
      include_adult: "false",
      sort_by: TMDB_SORT[q.sortBy],
      // évite les films notés 10/10 avec 1 seul vote quand on trie par note
      ...(q.sortBy === "rating" && { "vote_count.gte": 100 }),
      ...(q.genre && { with_genres: q.genre }),
      ...(q.year && { primary_release_year: q.year }),
      ...(q.minRating !== undefined && { "vote_average.gte": q.minRating }),
    });
    movies = data.results;
  }

  const results = movies.map(toDiscoveryMovie);
  const isEmpty = results.length === 0;

  return {
    results,
    page: data.page,
    totalPages: Math.min(data.total_pages, 500), // TMDB limite à 500 pages
    totalResults: data.total_results,
    isEmpty,
    emptyMessage: isEmpty ? buildEmptyMessage(q) : null,
  };
}

// Liste des genres (pour remplir le filtre côté front)
export async function getGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<{ genres: Genre[] }>("/genre/movie/list");
  return data.genres;
}
