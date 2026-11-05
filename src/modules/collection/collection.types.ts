export const COLLECTION_STATUSES = ["planned", "watching", "watched"] as const;
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

export interface CollectionMovieInput {
  movieId: number;
  title: string;
  overview?: string;
  posterUrl?: string | null;
  releaseDate?: string | null;
  year?: number | null;
  rating?: number;
  genreIds?: number[];
}

export interface CollectionMovieDto extends CollectionMovieInput {
  id: string;
  status: CollectionStatus;
  favorite: boolean;
  watchHistory: string[];
  viewingCount: number;
  lastWatchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
