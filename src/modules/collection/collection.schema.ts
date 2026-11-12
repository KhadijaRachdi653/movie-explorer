import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { COLLECTION_STATUSES } from "./collection.types";

const movieSchema = z.object({
  movieId: z.string().refine((id) => isValidObjectId(id), "Identifiant de film invalide."),
  title: z.string().trim().min(1).max(200),
  overview: z.string().max(5000).optional(),
  posterUrl: z.string().url().max(500).nullable().optional(),
  releaseDate: z.string().max(20).nullable().optional(),
  year: z.number().int().min(1870).max(2200).nullable().optional(),
  rating: z.number().min(0).max(10).optional(),
  genres: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

export const createCollectionItemSchema = z.object({
  movie: movieSchema,
  status: z.enum(COLLECTION_STATUSES).default("planned"),
  favorite: z.boolean().default(false),
});

export const updateCollectionItemSchema = z.object({
  movie: movieSchema.optional(),
  status: z.enum(COLLECTION_STATUSES).optional(),
  favorite: z.boolean().optional(),
}).refine((value) => value.movie !== undefined || value.status !== undefined || value.favorite !== undefined, {
  message: "Envoyez au moins un champ à modifier.",
});

export function isValidCollectionItemId(id: string): boolean {
  return isValidObjectId(id);
}
