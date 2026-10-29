// Types du Module 5 — Movie Discovery

export const SORT_OPTIONS = ["popularity", "rating", "release_date", "title"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

// Film renvoyé au front (format simplifié et stable)
export interface DiscoveryMovie {
  movieId: number; // identifiant TMDB (≠ _id MongoDB)
  title: string;
  overview: string;
  posterUrl: string | null;
  releaseDate: string | null;
  year: number | null;
  rating: number; // note moyenne TMDB /10
  voteCount: number;
  genreIds: number[];
}

export interface SearchResponse {
  results: DiscoveryMovie[];
  page: number;
  totalPages: number;
  totalResults: number;
  isEmpty: boolean;
  emptyMessage: string | null; // message prêt à afficher si aucun résultat
}

export interface Genre {
  id: number;
  name: string;
}
