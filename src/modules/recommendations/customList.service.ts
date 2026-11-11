import dbConnect from "@/lib/mongodb";
import CustomList, { MAX_LISTS_PER_USER, MAX_MOVIES_PER_LIST, type CustomListDoc } from "./customList.model";
import { canEditList, canViewList } from "./permissions";
import { ApiError } from "./errors";
import type { AddMovieInput, CreateListInput, UpdateListInput } from "./customList.schema";
import type { CustomListDTO } from "./types";

// Logique métier des listes personnalisées (CRUD + films)

export function toDTO(doc: CustomListDoc): CustomListDTO {
  const movies = (doc.movies ?? []).map((m) => ({
    movieId: m.movieId,
    title: m.title,
    posterPath: m.posterPath ?? null,
    genreIds: m.genreIds ?? [],
    addedAt: new Date(m.addedAt).toISOString(),
  }));
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    description: doc.description ?? "",
    visibility: doc.visibility,
    movieIds: movies.map((m) => m.movieId),
    movies,
    moviesCount: movies.length,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

// Charge une liste et vérifie le droit demandé (404 si absente, 403 si interdit)
async function loadList(listId: string, userId: string | null, access: "view" | "edit"): Promise<CustomListDoc> {
  await dbConnect();
  const list = await CustomList.findById(listId).lean<CustomListDoc>();
  if (!list) throw new ApiError(404, "Liste introuvable.");

  const info = { ownerId: list.userId.toString(), visibility: list.visibility };
  const allowed = access === "view" ? canViewList(info, userId) : canEditList(info, userId);
  if (!allowed) {
    throw new ApiError(403, access === "view" ? "Cette liste est privée." : "Vous ne pouvez modifier que vos propres listes.");
  }
  return list;
}

export async function getUserLists(userId: string): Promise<CustomListDTO[]> {
  await dbConnect();
  const lists = await CustomList.find({ userId }).sort({ updatedAt: -1 }).lean<CustomListDoc[]>();
  return lists.map(toDTO);
}

export async function createList(userId: string, input: CreateListInput): Promise<CustomListDTO> {
  await dbConnect();
  const count = await CustomList.countDocuments({ userId });
  if (count >= MAX_LISTS_PER_USER) {
    throw new ApiError(409, `Limite atteinte : ${MAX_LISTS_PER_USER} listes maximum.`);
  }
  const list = await CustomList.create({ ...input, userId });
  return toDTO(list.toObject());
}

export async function getList(listId: string, userId: string | null): Promise<CustomListDTO> {
  return toDTO(await loadList(listId, userId, "view"));
}

export async function updateList(listId: string, userId: string, input: UpdateListInput): Promise<CustomListDTO> {
  await loadList(listId, userId, "edit");
  const updated = await CustomList.findByIdAndUpdate(listId, { $set: input }, { returnDocument: "after", runValidators: true }).lean<CustomListDoc>();
  if (!updated) throw new ApiError(404, "Liste introuvable.");
  return toDTO(updated);
}

export async function deleteList(listId: string, userId: string): Promise<void> {
  await loadList(listId, userId, "edit");
  await CustomList.deleteOne({ _id: listId });
}

export async function addMovieToList(listId: string, userId: string, movie: AddMovieInput): Promise<CustomListDTO> {
  const list = await loadList(listId, userId, "edit");
  if (list.movies.some((m) => m.movieId === movie.movieId)) {
    throw new ApiError(409, "Ce film est déjà dans la liste.");
  }
  if (list.movies.length >= MAX_MOVIES_PER_LIST) {
    throw new ApiError(409, `Limite atteinte : ${MAX_MOVIES_PER_LIST} films maximum par liste.`);
  }
  // Condition anti-doublon aussi dans la requête (sécurité en cas de requêtes simultanées)
  const updated = await CustomList.findOneAndUpdate(
    { _id: listId, "movies.movieId": { $ne: movie.movieId } },
    { $push: { movies: { ...movie, addedAt: new Date() } } },
    { returnDocument: "after", runValidators: true }
  ).lean<CustomListDoc>();
  if (!updated) throw new ApiError(409, "Ce film est déjà dans la liste.");
  return toDTO(updated);
}

export async function removeMovieFromList(listId: string, userId: string, movieId: number): Promise<CustomListDTO> {
  const list = await loadList(listId, userId, "edit");
  if (!list.movies.some((m) => m.movieId === movieId)) {
    throw new ApiError(404, "Ce film n'est pas dans la liste.");
  }
  const updated = await CustomList.findByIdAndUpdate(
    listId,
    { $pull: { movies: { movieId } } },
    { returnDocument: "after" }
  ).lean<CustomListDoc>();
  if (!updated) throw new ApiError(404, "Liste introuvable.");
  return toDTO(updated);
}
