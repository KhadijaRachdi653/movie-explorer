import { z } from "zod";
import { isValidObjectId } from "mongoose";

export const movieSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Le titre est obligatoire.")
    .max(200, "Titre trop long (200 max)."),
  overview: z.string().trim().default(""),
  posterUrl: z
    .union([z.literal(""), z.url("URL d'affiche invalide.")])
    .default(""),
  year: z.coerce
    .number()
    .int()
    .min(1888, "Année invalide.")
    .max(new Date().getFullYear() + 5, "Année invalide."),
  genres: z.array(z.string().trim().min(1)).default([]),
  director: z.string().trim().default(""),
  rating: z.coerce
    .number()
    .min(0, "Note entre 0 et 10.")
    .max(10, "Note entre 0 et 10.")
    .default(0),
});

export const updateMovieSchema = movieSchema.partial();

export const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type MovieInput = z.infer<typeof movieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;

export const isValidMovieId = (id: string) => isValidObjectId(id);
