import type { ListMovie, RecommendedMovie } from "@/modules/recommendations/types";

// Format commun aux cartes de films (recommandations, listes, recherche) ; movieId = identifiant du catalogue
export interface CardMovie {
  movieId: string;
  title: string;
  posterUrl: string | null;
  backdropUrl?: string | null;
  overview?: string;
  rating?: number;
  year?: number | null;
  genres: string[];
  reason?: string | null;
  match?: number | null; // compatibilité en %, recommandations personnalisées uniquement
}

export function fromRecommended(m: RecommendedMovie): CardMovie {
  return {
    movieId: m.movieId,
    title: m.title,
    posterUrl: m.posterUrl,
    backdropUrl: m.backdropUrl,
    overview: m.overview,
    rating: m.rating,
    year: m.year,
    genres: m.genres,
    reason: m.reason,
    match: m.match,
  };
}

export function fromListMovie(m: ListMovie): CardMovie {
  return { movieId: m.movieId, title: m.title, posterUrl: m.posterUrl, genres: m.genres };
}

// Données envoyées à POST /api/lists/[id]/movies : le reste de la fiche est lu dans le catalogue
export function toListMovieInput(m: CardMovie) {
  return { movieId: m.movieId };
}
