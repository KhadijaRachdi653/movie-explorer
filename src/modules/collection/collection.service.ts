import dbConnect from "@/lib/mongodb";
import CollectionItem, { type CollectionItemDoc } from "./collection.model";
import type { CollectionMovieDto, CollectionStatus } from "./collection.types";
import type { z } from "zod";
import { createCollectionItemSchema, updateCollectionItemSchema } from "./collection.schema";
import { ApiError } from "@/modules/discovery/http";

type CreateInput = z.infer<typeof createCollectionItemSchema>;
type UpdateInput = z.infer<typeof updateCollectionItemSchema>;

function toDto(doc: CollectionItemDoc): CollectionMovieDto {
  const watchHistory = (doc.watchHistory ?? []).map((viewing) => viewing.watchedAt.toISOString());
  return {
    id: doc._id.toString(),
    ...doc.movie,
    status: doc.status,
    favorite: doc.favorite,
    watchHistory,
    viewingCount: watchHistory.length,
    lastWatchedAt: watchHistory.at(-1) ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

async function findOwned(id: string, userId: string): Promise<CollectionItemDoc> {
  const doc = await CollectionItem.findOne({ _id: id, userId }).lean<CollectionItemDoc>();
  if (!doc) throw new ApiError(404, "Film introuvable dans votre collection.");
  return doc;
}

export async function getUserCollection(userId: string, filter?: { favorite?: boolean; status?: CollectionStatus }): Promise<CollectionMovieDto[]> {
  await dbConnect();
  const docs = await CollectionItem.find({ userId, ...filter }).sort({ updatedAt: -1 }).lean<CollectionItemDoc[]>();
  return docs.map(toDto);
}

export async function addCollectionItem(userId: string, input: CreateInput): Promise<CollectionMovieDto> {
  await dbConnect();
  try {
    const doc = await CollectionItem.findOneAndUpdate(
      { userId, "movie.movieId": input.movie.movieId },
      {
        $set: { movie: input.movie, status: input.status, favorite: input.favorite },
        $setOnInsert: {
          userId,
          ...(input.status === "watched" && { watchHistory: [{ watchedAt: new Date() }] }),
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean<CollectionItemDoc>();
    if (!doc) throw new ApiError(500, "Impossible d'enregistrer ce film.");
    return toDto(doc);
  } catch (err) {
    if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
      throw new ApiError(409, "Ce film est déjà dans votre collection.");
    }
    throw err;
  }
}

export async function updateCollectionItem(id: string, userId: string, input: UpdateInput): Promise<CollectionMovieDto> {
  await dbConnect();
  const current = await findOwned(id, userId);
  const { status, ...otherChanges } = input;
  const update: Record<string, unknown> = { $set: otherChanges };
  if (status !== undefined) update.$set = { ...otherChanges, status };
  if (status === "watched" && current.status !== "watched") {
    update.$push = { watchHistory: { watchedAt: new Date() } };
  }
  const doc = await CollectionItem.findOneAndUpdate({ _id: id, userId }, update, { new: true, runValidators: true }).lean<CollectionItemDoc>();
  if (!doc) throw new ApiError(404, "Film introuvable dans votre collection.");
  return toDto(doc);
}

export async function recordViewing(id: string, userId: string): Promise<CollectionMovieDto> {
  await dbConnect();
  const doc = await CollectionItem.findOneAndUpdate(
    { _id: id, userId },
    { $set: { status: "watched" }, $push: { watchHistory: { watchedAt: new Date() } } },
    { new: true, runValidators: true }
  ).lean<CollectionItemDoc>();
  if (!doc) throw new ApiError(404, "Film introuvable dans votre collection.");
  return toDto(doc);
}

export async function deleteCollectionItem(id: string, userId: string): Promise<void> {
  await dbConnect();
  const result = await CollectionItem.deleteOne({ _id: id, userId });
  if (!result.deletedCount) throw new ApiError(404, "Film introuvable dans votre collection.");
}
