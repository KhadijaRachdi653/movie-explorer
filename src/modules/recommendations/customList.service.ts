import dbConnect from "@/lib/mongodb";
import CustomList, { MAX_LISTS_PER_USER, MAX_MOVIES_PER_LIST, type CustomListDoc } from "./customList.model";
import { canEditList, canViewList } from "./permissions";
import { ApiError } from "./errors";
import type { CreateListInput, UpdateListInput } from "./customList.schema";
import { getCatalogMap, type CatalogMovie } from "./catalogue";
import type { CustomListDTO } from "./types";

// Logique métier des listes personnalisées (CRUD + films)

// Titre, affiche et genres viennent du catalogue ; un film retiré du catalogue n'est plus affiché
export function toDTO(doc: CustomListDoc, catalogue: Map<string, CatalogMovie>): CustomListDTO {
  const movies = (doc.movies ?? []).flatMap((m) => {
    const movie = catalogue.get(m.movieId);
    return movie
      ? [{ movieId: m.movieId, title: movie.title, posterUrl: movie.posterUrl, genres: movie.genres, addedAt: new Date(m.addedAt).toISOString() }]
      : [];
  });
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
  return withMovies(lists);
}

// Une seule lecture du catalogue pour toutes les listes
async function withMovies(lists: CustomListDoc[]): Promise<CustomListDTO[]> {
  const catalogue = await getCatalogMap(lists.flatMap((l) => (l.movies ?? []).map((m) => m.movieId)));
  return lists.map((l) => toDTO(l, catalogue));
}

async function withMoviesOne(list: CustomListDoc): Promise<CustomListDTO> {
  return (await withMovies([list]))[0];
}

export async function createList(userId: string, input: CreateListInput): Promise<CustomListDTO> {
  await dbConnect();
  const count = await CustomList.countDocuments({ userId });
  if (count >= MAX_LISTS_PER_USER) {
    throw new ApiError(409, `Limite atteinte : ${MAX_LISTS_PER_USER} listes maximum.`);
  }
  const list = await CustomList.create({ ...input, userId });
  return withMoviesOne(list.toObject());
}

export async function getList(listId: string, userId: string | null): Promise<CustomListDTO> {
  return withMoviesOne(await loadList(listId, userId, "view"));
}

export async function updateList(listId: string, userId: string, input: UpdateListInput): Promise<CustomListDTO> {
  await loadList(listId, userId, "edit");
  const updated = await CustomList.findByIdAndUpdate(listId, { $set: input }, { returnDocument: "after", runValidators: true }).lean<CustomListDoc>();
  if (!updated) throw new ApiError(404, "Liste introuvable.");
  return withMoviesOne(updated);
}

export async function deleteList(listId: string, userId: string): Promise<void> {
  await loadList(listId, userId, "edit");
  await CustomList.deleteOne({ _id: listId });
}

export async function addMovieToList(listId: string, userId: string, movieId: string): Promise<CustomListDTO> {
  const list = await loadList(listId, userId, "edit");
  if (!(await getCatalogMap([movieId])).has(movieId)) {
    throw new ApiError(404, "Film introuvable dans le catalogue.");
  }
  if (list.movies.some((m) => m.movieId === movieId)) {
    throw new ApiError(409, "Ce film est déjà dans la liste.");
  }
  if (list.movies.length >= MAX_MOVIES_PER_LIST) {
    throw new ApiError(409, `Limite atteinte : ${MAX_MOVIES_PER_LIST} films maximum par liste.`);
  }
  // Condition anti-doublon aussi dans la requête (sécurité en cas de requêtes simultanées)
  const updated = await CustomList.findOneAndUpdate(
    { _id: listId, "movies.movieId": { $ne: movieId } },
    { $push: { movies: { movieId, addedAt: new Date() } } },
    { returnDocument: "after", runValidators: true }
  ).lean<CustomListDoc>();
  if (!updated) throw new ApiError(409, "Ce film est déjà dans la liste.");
  return withMoviesOne(updated);
}

export async function removeMovieFromList(listId: string, userId: string, movieId: string): Promise<CustomListDTO> {
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
  return withMoviesOne(updated);
}
