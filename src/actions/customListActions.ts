"use server";

import { z } from "zod";
import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import CustomList from "@/models/CustomList";
import type { CustomListDTO, ModuleResult } from "@/types/customList";

// ---------- Règles métier ----------
const MAX_LISTS_PER_USER = 20;
const MAX_MOVIES_PER_LIST = 100;

// ---------- Validation (zod) ----------
const listSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(50, "Le nom ne doit pas dépasser 50 caractères."),
  description: z
    .string()
    .trim()
    .max(300, "La description ne doit pas dépasser 300 caractères.")
    .optional()
    .default(""),
  isPublic: z.boolean().optional().default(false),
});

const movieSchema = z.object({
  tmdbId: z.number().int().positive("Identifiant TMDB invalide."),
  title: z.string().trim().min(1, "Le titre est obligatoire."),
  posterPath: z.string().nullable().optional().default(null),
});

export type ListInput = z.input<typeof listSchema>;
export type MovieInput = z.input<typeof movieSchema>;

// ---------- Helpers ----------
async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

// Convertit un document Mongo en objet simple (sérialisable vers le client)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDTO(doc: any): CustomListDTO {
  return {
    id: doc._id.toString(),
    userId: doc.user.toString(),
    name: doc.name,
    description: doc.description ?? "",
    isPublic: !!doc.isPublic,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    movies: (doc.movies ?? []).map((m: any) => ({
      tmdbId: m.tmdbId,
      title: m.title,
      posterPath: m.posterPath ?? null,
      addedAt: new Date(m.addedAt).toISOString(),
    })),
    moviesCount: doc.movies?.length ?? 0,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isDuplicateKey(err: any) {
  return err?.code === 11000;
}

function refresh(listId?: string) {
  revalidatePath("/lists");
  if (listId) revalidatePath(`/lists/${listId}`);
}

// ---------- CREATE ----------
export async function createList(
  input: ListInput,
): Promise<ModuleResult<CustomListDTO>> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Non autorisé." };

    const parsed = listSchema.safeParse(input);
    if (!parsed.success)
      return { success: false, error: parsed.error.issues[0].message };

    await dbConnect();

    const count = await CustomList.countDocuments({ user: userId });
    if (count >= MAX_LISTS_PER_USER) {
      return {
        success: false,
        error: `Limite atteinte : ${MAX_LISTS_PER_USER} listes maximum.`,
      };
    }

    const list = await CustomList.create({ ...parsed.data, user: userId });
    refresh();
    return {
      success: true,
      message: "Liste créée avec succès !",
      data: toDTO(list),
    };
  } catch (err) {
    if (isDuplicateKey(err))
      return { success: false, error: "Vous avez déjà une liste avec ce nom." };
    console.error("Erreur création liste :", err);
    return { success: false, error: "Erreur lors de la création de la liste." };
  }
}

// ---------- READ : mes listes ----------
export async function getMyLists(): Promise<ModuleResult<CustomListDTO[]>> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Non autorisé." };

    await dbConnect();
    const lists = await CustomList.find({ user: userId })
      .sort({ updatedAt: -1 })
      .lean();
    return { success: true, data: lists.map(toDTO) };
  } catch (err) {
    console.error("Erreur lecture listes :", err);
    return { success: false, error: "Erreur lors du chargement des listes." };
  }
}

// ---------- READ : une liste (propriétaire OU liste publique) ----------
export async function getListById(
  listId: string,
): Promise<ModuleResult<CustomListDTO>> {
  try {
    if (!isValidObjectId(listId))
      return { success: false, error: "Identifiant de liste invalide." };

    await dbConnect();
    const list = await CustomList.findById(listId).lean();
    if (!list) return { success: false, error: "Liste introuvable." };

    const userId = await getUserId();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = list as any;
    if (!doc.isPublic && doc.user.toString() !== userId) {
      return { success: false, error: "Cette liste est privée." };
    }
    return { success: true, data: toDTO(doc) };
  } catch (err) {
    console.error("Erreur lecture liste :", err);
    return { success: false, error: "Erreur lors du chargement de la liste." };
  }
}

// ---------- UPDATE ----------
export async function updateList(
  listId: string,
  input: Partial<ListInput>,
): Promise<ModuleResult<CustomListDTO>> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Non autorisé." };
    if (!isValidObjectId(listId))
      return { success: false, error: "Identifiant de liste invalide." };

    const parsed = listSchema.partial().safeParse(input);
    if (!parsed.success)
      return { success: false, error: parsed.error.issues[0].message };

    await dbConnect();
    // Le filtre { user: userId } garantit qu'on ne modifie que SES listes
    const list = await CustomList.findOneAndUpdate(
      { _id: listId, user: userId },
      { $set: parsed.data },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!list) return { success: false, error: "Liste introuvable." };

    refresh(listId);
    return { success: true, message: "Liste mise à jour !", data: toDTO(list) };
  } catch (err) {
    if (isDuplicateKey(err))
      return { success: false, error: "Vous avez déjà une liste avec ce nom." };
    console.error("Erreur mise à jour liste :", err);
    return {
      success: false,
      error: "Erreur lors de la modification de la liste.",
    };
  }
}

// ---------- DELETE ----------
export async function deleteList(listId: string): Promise<ModuleResult> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Non autorisé." };
    if (!isValidObjectId(listId))
      return { success: false, error: "Identifiant de liste invalide." };

    await dbConnect();
    const res = await CustomList.deleteOne({ _id: listId, user: userId });
    if (res.deletedCount === 0)
      return { success: false, error: "Liste introuvable." };

    refresh();
    return { success: true, message: "Liste supprimée.", data: undefined };
  } catch (err) {
    console.error("Erreur suppression liste :", err);
    return {
      success: false,
      error: "Erreur lors de la suppression de la liste.",
    };
  }
}

// ---------- Ajouter un film à une liste ----------
export async function addMovieToList(
  listId: string,
  movie: MovieInput,
): Promise<ModuleResult<CustomListDTO>> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Non autorisé." };
    if (!isValidObjectId(listId))
      return { success: false, error: "Identifiant de liste invalide." };

    const parsed = movieSchema.safeParse(movie);
    if (!parsed.success)
      return { success: false, error: parsed.error.issues[0].message };

    await dbConnect();
    const list = await CustomList.findOne({ _id: listId, user: userId });
    if (!list) return { success: false, error: "Liste introuvable." };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (list.movies.some((m: any) => m.tmdbId === parsed.data.tmdbId)) {
      return { success: false, error: "Ce film est déjà dans la liste." };
    }
    if (list.movies.length >= MAX_MOVIES_PER_LIST) {
      return {
        success: false,
        error: `Limite atteinte : ${MAX_MOVIES_PER_LIST} films maximum par liste.`,
      };
    }

    list.movies.push({ ...parsed.data, addedAt: new Date() });
    await list.save();

    refresh(listId);
    return {
      success: true,
      message: "Film ajouté à la liste !",
      data: toDTO(list),
    };
  } catch (err) {
    console.error("Erreur ajout film :", err);
    return { success: false, error: "Erreur lors de l'ajout du film." };
  }
}

// ---------- Retirer un film d'une liste ----------
export async function removeMovieFromList(
  listId: string,
  tmdbId: number,
): Promise<ModuleResult<CustomListDTO>> {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Non autorisé." };
    if (!isValidObjectId(listId))
      return { success: false, error: "Identifiant de liste invalide." };

    await dbConnect();
    const list = await CustomList.findOneAndUpdate(
      { _id: listId, user: userId, "movies.tmdbId": tmdbId },
      { $pull: { movies: { tmdbId } } },
      { returnDocument: "after" },
    ).lean();
    if (!list) return { success: false, error: "Liste ou film introuvable." };

    refresh(listId);
    return {
      success: true,
      message: "Film retiré de la liste.",
      data: toDTO(list),
    };
  } catch (err) {
    console.error("Erreur retrait film :", err);
    return { success: false, error: "Erreur lors du retrait du film." };
  }
}
