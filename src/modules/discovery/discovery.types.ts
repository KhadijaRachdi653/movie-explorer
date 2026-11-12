// Types du Module 5 — Movie Discovery

export const SORT_OPTIONS = [
  "popularity",
  "rating",
  "release_date",
  "title",
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

// Film renvoyé au front (format simplifié et stable)
export interface DiscoveryMovie {
  movieId: string;
  title: string;
  overview: string;
  posterUrl: string | null;
  year: number | null;
  rating: number;
  genres: string[];
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
  id: string;
  name: string;
}
