import dbConnect from "@/lib/mongodb";
import SavedSearch, { MAX_SAVED_SEARCHES_PER_USER, type SavedSearchDoc } from "./savedSearch.model";
import type { CreateSavedSearchInput, UpdateSavedSearchInput } from "./savedSearch.schema";
import { searchMovies } from "./discovery.service";
import { ApiError } from "./http";
import type { SearchResponse } from "./discovery.types";

// Format renvoyé au front
export interface SavedSearchDto {
  id: string;
  name: string;
  filters: SavedSearchDoc["filters"];
  createdAt: string;
  updatedAt: string;
}

function toDto(doc: SavedSearchDoc): SavedSearchDto {
  const { query, genre, year, minRating, sortBy } = doc.filters;
  return {
    id: doc._id.toString(),
    name: doc.name,
    // seuls les filtres renseignés sont renvoyés
    filters: {
      ...(query != null && { query }),
      ...(genre != null && { genre }),
      ...(year != null && { year }),
      ...(minRating != null && { minRating }),
      sortBy,
    },
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// Récupère une recherche appartenant à l'utilisateur (404 sinon, sans révéler qu'elle existe)
async function findOwned(id: string, userId: string): Promise<SavedSearchDoc> {
  const doc = await SavedSearch.findOne({ _id: id, userId }).lean<SavedSearchDoc>();
  if (!doc) throw new ApiError(404, "Recherche sauvegardée introuvable.");
  return doc;
}

// Règle métier : un utilisateur ne peut pas avoir deux recherches du même nom (insensible à la casse)
async function assertNameAvailable(userId: string, name: string, excludeId?: string): Promise<void> {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existing = await SavedSearch.exists({
    userId,
    name: { $regex: `^${escaped}$`, $options: "i" },
    ...(excludeId && { _id: { $ne: excludeId } }),
  });
  if (existing) throw new ApiError(409, "Vous avez déjà une recherche sauvegardée avec ce nom.");
}

// C — créer
export async function createSavedSearch(userId: string, input: CreateSavedSearchInput): Promise<SavedSearchDto> {
  await dbConnect();
  await assertNameAvailable(userId, input.name);
  const count = await SavedSearch.countDocuments({ userId });
  if (count >= MAX_SAVED_SEARCHES_PER_USER) {
    throw new ApiError(409, `Limite atteinte : ${MAX_SAVED_SEARCHES_PER_USER} recherches sauvegardées maximum.`);
  }
  const doc = await SavedSearch.create({ userId, name: input.name, filters: input.filters });
  return toDto(doc.toObject());
}

// R — lister (plus récentes d'abord)
export async function getUserSavedSearches(userId: string): Promise<SavedSearchDto[]> {
  await dbConnect();
  const docs = await SavedSearch.find({ userId }).sort({ updatedAt: -1 }).lean<SavedSearchDoc[]>();
  return docs.map(toDto);
}

// R — détail
export async function getSavedSearch(id: string, userId: string): Promise<SavedSearchDto> {
  await dbConnect();
  return toDto(await findOwned(id, userId));
}

// R — relancer la recherche enregistrée sur TMDB
export async function runSavedSearch(id: string, userId: string, page: number): Promise<SearchResponse> {
  await dbConnect();
  const { filters } = await findOwned(id, userId);
  try {
    return await searchMovies({ ...filters, page });
  } catch (err) {
    console.error("Erreur TMDB (recherche sauvegardée) :", err);
    throw new ApiError(502, "Le service de films est momentanément indisponible.");
  }
}

// U — modifier le nom et/ou les filtres
export async function updateSavedSearch(
  id: string,
  userId: string,
  input: UpdateSavedSearchInput
): Promise<SavedSearchDto> {
  await dbConnect();
  await findOwned(id, userId); // 404 avant tout si la recherche n'est pas à l'utilisateur
  if (input.name !== undefined) await assertNameAvailable(userId, input.name, id);
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.filters !== undefined) update.filters = input.filters;

  const doc = await SavedSearch.findOneAndUpdate({ _id: id, userId }, { $set: update }, {
    new: true,
    runValidators: true,
  }).lean<SavedSearchDoc>();
  if (!doc) throw new ApiError(404, "Recherche sauvegardée introuvable.");
  return toDto(doc);
}

// D — supprimer
export async function deleteSavedSearch(id: string, userId: string): Promise<void> {
  await dbConnect();
  const res = await SavedSearch.deleteOne({ _id: id, userId });
  if (res.deletedCount === 0) throw new ApiError(404, "Recherche sauvegardée introuvable.");
}
