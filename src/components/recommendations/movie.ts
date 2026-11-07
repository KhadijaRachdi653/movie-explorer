import type { ListMovie, RecommendedMovie } from "@/modules/recommendations/types";

// Format commun aux cartes de films (recommandations, listes, recherche)
export interface CardMovie {
  movieId: number;
  title: string;
  posterUrl: string | null;
  backdropUrl?: string | null;
  overview?: string;
  rating?: number;
  year?: number | null;
  genreIds: number[];
  reason?: string | null;
  match?: number | null; // compatibilité en %, recommandations personnalisées uniquement
}

export const TMDB_POSTER = "https://image.tmdb.org/t/p/w500";

export function fromRecommended(m: RecommendedMovie): CardMovie {
  return {
    movieId: m.movieId,
    title: m.title,
    posterUrl: m.posterUrl,
    backdropUrl: m.backdropUrl,
    overview: m.overview,
    rating: m.rating,
    year: m.releaseDate ? Number(m.releaseDate.slice(0, 4)) : null,
    genreIds: m.genreIds,
    reason: m.reason,
    match: m.match,
  };
}

export function fromListMovie(m: ListMovie): CardMovie {
  return {
    movieId: m.movieId,
    title: m.title,
    posterUrl: m.posterPath ? `${TMDB_POSTER}${m.posterPath}` : null,
    genreIds: m.genreIds,
  };
}

// Données envoyées à POST /api/lists/[id]/movies
export function toListMovieInput(m: CardMovie) {
  return {
    movieId: m.movieId,
    title: m.title,
    posterPath: m.posterUrl?.startsWith(TMDB_POSTER) ? m.posterUrl.slice(TMDB_POSTER.length) : null,
    genreIds: m.genreIds.slice(0, 20),
  };
}
