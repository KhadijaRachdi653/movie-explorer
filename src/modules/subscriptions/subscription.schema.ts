import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { BILLING_PERIODS, SUBSCRIPTION_STATUSES, findPlan } from "./subscription.constants";

export const isValidSubscriptionId = (id: string) => isValidObjectId(id);

export const SUBSCRIPTION_SORTS = ["recent", "oldest", "price-desc", "price-asc", "end-soon"] as const;
export type SubscriptionSort = (typeof SUBSCRIPTION_SORTS)[number];

const planNameSchema = z
  .string()
  .trim()
  .min(2, "Le nom de l'offre doit faire au moins 2 caractères.")
  .max(50, "Le nom de l'offre ne peut pas dépasser 50 caractères.");

const catalogPlanSchema = z
  .string()
  .trim()
  .refine((name) => !!findPlan(name), "Cette offre n'existe pas.");

const billingPeriodSchema = z.enum(BILLING_PERIODS, { error: "Période de facturation invalide (mensuel ou annuel)." });
const statusSchema = z.enum(SUBSCRIPTION_STATUSES, { error: "Statut invalide." });
const priceSchema = z.coerce.number({ error: "Prix invalide." }).min(0, "Le prix ne peut pas être négatif.").max(100000);
const dateSchema = z.coerce.date({ error: "Date invalide." });

// Utilisateur : souscrire à une offre du catalogue. Le prix est fixé par le serveur et
// aucune donnée de carte n'est envoyée (le paiement est simulé dans le navigateur).
export const subscribeSchema = z.object({
  planName: catalogPlanSchema,
  billingPeriod: billingPeriodSchema,
});

// Utilisateur : changer d'offre (upgrade / downgrade) ou résilier son abonnement
export const ownerUpdateSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("change-plan"), planName: catalogPlanSchema, billingPeriod: billingPeriodSchema }),
  z.object({ action: z.literal("cancel") }),
]);

// Administrateur : création libre pour n'importe quel utilisateur (identifié par son e-mail)
export const adminCreateSchema = z
  .object({
    userEmail: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
    planName: planNameSchema,
    description: z.string().trim().max(300, "Description trop longue (300 caractères max).").optional().default(""),
    price: priceSchema,
    billingPeriod: billingPeriodSchema,
    startDate: dateSchema,
    endDate: dateSchema.nullable().optional(),
    status: statusSchema,
  })
  .refine((v) => !v.endDate || v.endDate > v.startDate, {
    message: "La date de fin doit être postérieure à la date de début.",
    path: ["endDate"],
  });

// Administrateur : modification partielle de n'importe quel champ (l'utilisateur propriétaire ne change pas)
export const adminUpdateSchema = z
  .object({
    planName: planNameSchema,
    description: z.string().trim().max(300, "Description trop longue (300 caractères max)."),
    price: priceSchema,
    billingPeriod: billingPeriodSchema,
    startDate: dateSchema,
    endDate: dateSchema.nullable(),
    status: statusSchema,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Rien à modifier.");

// Recherche et filtres de la liste
export const listSubscriptionsSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  status: z.union([statusSchema, z.literal("")]).optional().default(""),
  billingPeriod: z.union([billingPeriodSchema, z.literal("")]).optional().default(""),
  planName: z.string().trim().max(50).optional().default(""),
  sort: z.enum(SUBSCRIPTION_SORTS).default("recent"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  // « all » : toutes les souscriptions de la plateforme (administrateur uniquement)
  scope: z.enum(["mine", "all"]).default("mine"),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type OwnerUpdateInput = z.infer<typeof ownerUpdateSchema>;
export type AdminCreateInput = z.infer<typeof adminCreateSchema>;
export type AdminUpdateInput = z.infer<typeof adminUpdateSchema>;
export type ListSubscriptionsInput = z.infer<typeof listSubscriptionsSchema>;
