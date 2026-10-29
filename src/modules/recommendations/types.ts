// Types du Module 6 — Recommandations & Listes personnalisées

export const VISIBILITIES = ["private", "public"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

// Film stocké dans une liste (movieId = identifiant TMDB, ≠ _id MongoDB)
export interface ListMovie {
  movieId: number;
  title: string;
  posterPath: string | null;
  genreIds: number[];
  addedAt: string; // ISO
}

// Liste renvoyée par l'API
export interface CustomListDTO {
  id: string;
  userId: string;
  name: string;
  description: string;
  visibility: Visibility;
  movieIds: number[]; // champ du cahier des charges
  movies: ListMovie[]; // détail pour l'affichage
  moviesCount: number;
  createdAt: string;
  updatedAt: string;
}

// Film recommandé renvoyé par l'API
export interface RecommendedMovie {
  movieId: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  releaseDate: string | null;
  rating: number;
  genreIds: number[];
  reason: string | null; // ex. « Parce que vous avez ajouté Fight Club »
}

export interface RecommendationsResponse {
  source: "personal" | "similar" | "trending";
  results: RecommendedMovie[];
}
