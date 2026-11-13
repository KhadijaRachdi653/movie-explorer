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

// Sources utilisées pour les recommandations personnalisées (une par module de l'équipe)
export interface RecommendationSources {
  listFilms: number; // Module 6 : films de vos listes
  favorites: number; // Module 4 : favoris
  watchlist: number; // Module 4 : films « À voir » / « En cours »
  watched: number; // Module 4 : films « Vu » (exclus)
  likedRatings: number; // Module 3 : films notés 4 ou 5 sur 5
  savedSearchGenres: string[]; // Module 5 : genres des recherches sauvegardées
}

export interface RecommendationsResponse {
  source: "personal" | "list" | "similar" | "trending";
  results: RecommendedMovie[];
  basedOn?: RecommendationSources; // seulement pour « personal »
}
