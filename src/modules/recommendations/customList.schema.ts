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

// movieId = identifiant du film dans le catalogue (Module 2)
export const movieIdParamSchema = z
  .string({ message: "movieId invalide : identifiant du catalogue attendu." })
  .trim()
  .refine((v) => isValidObjectId(v), "movieId invalide.");

export const addMovieSchema = z.object({ movieId: movieIdParamSchema });

export const recommendationsQuerySchema = z.object({
  trending: z.preprocess((v) => v === "true" || v === "1", z.boolean()),
  listId: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().refine((v) => isValidObjectId(v), "Identifiant de liste invalide.").optional()),
  movieId: z.preprocess((v) => (v === "" || v == null ? undefined : v), movieIdParamSchema.optional()),
  limit: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(1, "limit entre 1 et 40.").max(40, "limit entre 1 et 40.").default(20)),
});

export function isValidListId(id: string): boolean {
  return isValidObjectId(id);
}

export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type AddMovieInput = z.infer<typeof addMovieSchema>;
