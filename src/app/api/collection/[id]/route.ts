import { NextResponse } from "next/server";
import { deleteCollectionItem, updateCollectionItem } from "@/modules/collection/collection.service";
import { isValidCollectionItemId, updateCollectionItemSchema } from "@/modules/collection/collection.schema";
import { ApiError, readJson, requireUserId, toErrorResponse } from "@/modules/discovery/http";

type Context = { params: Promise<{ id: string }> };

async function idFrom(context: Context): Promise<string> {
  const { id } = await context.params;
  if (!isValidCollectionItemId(id)) throw new ApiError(400, "Identifiant de collection invalide.");
  return id;
}

export async function PATCH(request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const id = await idFrom(context);
    const input = updateCollectionItemSchema.parse(await readJson(request));
    return NextResponse.json(await updateCollectionItem(id, userId, input));
  } catch (err) {
    return toErrorResponse(err, "PATCH /api/collection/[id]");
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const id = await idFrom(context);
    await deleteCollectionItem(id, userId);
    return NextResponse.json({ message: "Film supprimé de votre collection." });
  } catch (err) {
    return toErrorResponse(err, "DELETE /api/collection/[id]");
  }
}
