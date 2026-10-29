// Types partagés du Module 6 (Recommandations & Listes personnalisées)

export interface ListMovie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  addedAt: string; // ISO
}

export interface CustomListDTO {
  id: string;
  userId: string;
  name: string;
  description: string;
  isPublic: boolean;
  movies: ListMovie[];
  moviesCount: number;
  createdAt: string;
  updatedAt: string;
}

// Format de retour commun à toutes les actions du module
export type ModuleResult<T = undefined> =
  | { success: true; message?: string; data: T }
  | { success: false; error: string };
