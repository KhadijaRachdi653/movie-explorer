// Types du Module 6 — Recommandations & Listes personnalisées

export const VISIBILITIES = ["private", "public"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

// Film d'une liste : movieId = identifiant du catalogue (Module 2) ; titre, affiche et genres lus dans le catalogue
export interface ListMovie {
  movieId: string;
  title: string;
  posterUrl: string | null;
  genres: string[];
  addedAt: string; // ISO
}

// Liste renvoyée par l'API
export interface CustomListDTO {
  id: string;
  userId: string;
  name: string;
  description: string;
  visibility: Visibility;
  movieIds: string[]; // champ du cahier des charges
  movies: ListMovie[]; // détail pour l'affichage
  moviesCount: number;
  createdAt: string;
  updatedAt: string;
}

// Film recommandé renvoyé par l'API
export interface RecommendedMovie {
  movieId: string;
  title: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null; // grande image de fond (bannière)
  year: number | null;
  rating: number; // sur 10
  genres: string[];
  reason: string | null; // ex. « Parce que vous avez ajouté Fight Club »
  match: number | null; // compatibilité 55–99 % (recommandations personnalisées uniquement)
}

export interface RecommendationsResponse {
  source: "personal" | "list" | "similar" | "trending";
  results: RecommendedMovie[];
}
