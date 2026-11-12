import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { searchQuerySchema } from "./discovery.schema";

// Filtres = mêmes règles que GET /api/search, sans la pagination
export const searchFiltersSchema = searchQuerySchema.omit({ page: true });

const nameSchema = z
  .string({ message: "Le nom est obligatoire." })
  .trim()
  .min(2, "Le nom doit contenir au moins 2 caractères.")
  .max(50, "Le nom ne doit pas dépasser 50 caractères.");

// POST /api/saved-searches
export const createSavedSearchSchema = z.object({
  name: nameSchema,
  filters: searchFiltersSchema.default({ sortBy: "popularity" }),
});

// PATCH /api/saved-searches/[id] : au moins un champ ; les filtres envoyés remplacent les anciens
export const updateSavedSearchSchema = z
  .object({
    name: nameSchema.optional(),
    filters: searchFiltersSchema.optional(),
  })
  .refine((v) => v.name !== undefined || v.filters !== undefined, {
    message: "Rien à modifier : envoyez « name » et/ou « filters ».",
  });

export type CreateSavedSearchInput = z.infer<typeof createSavedSearchSchema>;
export type UpdateSavedSearchInput = z.infer<typeof updateSavedSearchSchema>;

export function isValidSavedSearchId(id: string): boolean {
  return isValidObjectId(id);
}
