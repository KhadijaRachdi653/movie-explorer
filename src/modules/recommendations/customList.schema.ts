import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { VISIBILITIES } from "./types";

// Validation des entrées HTTP (corps et paramètres)

export const createListSchema = z.object({
  name: z.string({ message: "Le nom est obligatoire." }).trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(50, "Le nom ne doit pas dépasser 50 caractères."),
  description: z.string().trim().max(300, "La description ne doit pas dépasser 300 caractères.").optional().default(""),
  visibility: z.enum(VISIBILITIES, { message: "Visibilité invalide (private ou public)." }).optional().default("private"),
});

export const updateListSchema = z
  .object({
    name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(50, "Le nom ne doit pas dépasser 50 caractères.").optional(),
    description: z.string().trim().max(300, "La description ne doit pas dépasser 300 caractères.").optional(),
    visibility: z.enum(VISIBILITIES, { message: "Visibilité invalide (private ou public)." }).optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), { message: "Aucun champ à modifier." });

export const addMovieSchema = z.object({
  movieId: z.number({ message: "movieId doit être un nombre." }).int().positive("movieId invalide."),
  title: z.string({ message: "Le titre est obligatoire." }).trim().min(1, "Le titre est obligatoire.").max(200),
  posterPath: z.string().nullable().optional().default(null),
  genreIds: z.array(z.number().int().positive()).max(20).optional().default([]),
});

export const movieIdParamSchema = z.coerce.number().int().positive("movieId invalide.");

export const recommendationsQuerySchema = z.object({
  movieId: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().positive("movieId invalide.").optional()),
  limit: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(1, "limit entre 1 et 40.").max(40, "limit entre 1 et 40.").default(20)),
});

export function isValidListId(id: string): boolean {
  return isValidObjectId(id);
}

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type AddMovieInput = z.infer<typeof addMovieSchema>;
