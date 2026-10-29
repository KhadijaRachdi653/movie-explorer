import { z } from "zod";
import { SORT_OPTIONS } from "./discovery.types";

const MAX_YEAR = new Date().getFullYear() + 5;

// Les paramètres d'URL arrivent en texte : "" est traité comme absent
const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const searchQuerySchema = z.object({
  query: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(100, "La recherche ne doit pas dépasser 100 caractères.").optional()),
  genre: z.preprocess(emptyToUndefined, z.coerce.number().int().positive("Genre invalide.").optional()),
  year: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1900, "Année invalide.").max(MAX_YEAR, "Année invalide.").optional()),
  minRating: z.preprocess(emptyToUndefined, z.coerce.number().min(0, "La note minimale doit être entre 0 et 10.").max(10, "La note minimale doit être entre 0 et 10.").optional()),
  sortBy: z.preprocess(emptyToUndefined, z.enum(SORT_OPTIONS, { message: `Tri invalide (valeurs : ${SORT_OPTIONS.join(", ")}).` }).default("popularity")),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1, "Page invalide.").max(500, "Page maximale : 500.").default(1)),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
