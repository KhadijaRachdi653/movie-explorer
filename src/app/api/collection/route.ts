import { NextResponse } from "next/server";
import { addCollectionItem, getUserCollection } from "@/modules/collection/collection.service";
import { createCollectionItemSchema } from "@/modules/collection/collection.schema";
import { ApiError, readJson, requireUserId, toErrorResponse } from "@/modules/discovery/http";
import { COLLECTION_STATUSES, type CollectionStatus } from "@/modules/collection/collection.types";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const url = new URL(request.url);
    const favoriteValue = url.searchParams.get("favorite");
    if (favoriteValue !== null && favoriteValue !== "true" && favoriteValue !== "false") {
      throw new ApiError(400, "Le filtre favorite doit être true ou false.");
    }
    const statusValue = url.searchParams.get("status");
    if (statusValue !== null && !COLLECTION_STATUSES.includes(statusValue as CollectionStatus)) {
      throw new ApiError(400, "Statut de collection invalide.");
    }
    const filter = {
      ...(favoriteValue !== null && { favorite: favoriteValue === "true" }),
      ...(statusValue !== null && { status: statusValue as CollectionStatus }),
    };
    return NextResponse.json({ items: await getUserCollection(userId, filter) });
  } catch (err) {
    return toErrorResponse(err, "GET /api/collection");
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = createCollectionItemSchema.parse(await readJson(request));
    return NextResponse.json(await addCollectionItem(userId, input), { status: 201 });
  } catch (err) {
    return toErrorResponse(err, "POST /api/collection");
  }
}
