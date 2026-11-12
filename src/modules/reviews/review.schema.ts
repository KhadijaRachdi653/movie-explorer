import { z } from "zod";
import { isValidObjectId } from "mongoose";

// Un film est référencé par son identifiant dans le catalogue (Module 2)
export const isValidReviewId = (id: string) => isValidObjectId(id);

export const movieRefSchema = z
  .string()
  .trim()
  .refine((id) => isValidObjectId(id), "Identifiant de film invalide.");

export const REVIEW_SORTS = ["recent", "likes", "highest", "lowest"] as const;
export type ReviewSort = (typeof REVIEW_SORTS)[number];

export const ratingSchema = z.object({
  movieId: movieRefSchema,
  score: z.coerce
    .number()
    .int("La note doit être un entier.")
    .min(1, "Note entre 1 et 5.")
    .max(5, "Note entre 1 et 5."),
});

const contentSchema = z
  .string()
  .trim()
  .min(3, "Le commentaire est trop court (3 caractères minimum).")
  .max(1000, "Le commentaire ne peut pas dépasser 1000 caractères.");

export const createReviewSchema = z.object({
  movieId: movieRefSchema,
  content: contentSchema,
  spoiler: z.boolean().default(false),
});

export const updateReviewSchema = z
  .object({ content: contentSchema, spoiler: z.boolean() })
  .partial()
  .refine(
    (v) => v.content !== undefined || v.spoiler !== undefined,
    "Rien à modifier.",
  );

export const reportSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Indiquez une raison (3 caractères minimum).")
    .max(300, "Raison trop longue (300 max)."),
});

export const listReviewsSchema = z.object({
  movieId: movieRefSchema,
  sort: z.enum(REVIEW_SORTS).default("recent"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type RatingInput = z.infer<typeof ratingSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ListReviewsInput = z.infer<typeof listReviewsSchema>;
