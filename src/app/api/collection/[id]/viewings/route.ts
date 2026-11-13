import { NextResponse } from "next/server";
import { isValidCollectionItemId } from "@/modules/collection/collection.schema";
import { recordViewing } from "@/modules/collection/collection.service";
import { ApiError, requireUserId, toErrorResponse } from "@/modules/discovery/http";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    if (!isValidCollectionItemId(id)) throw new ApiError(400, "Identifiant de collection invalide.");
    return NextResponse.json(await recordViewing(id, userId), { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "POST /api/collection/[id]/viewings");
  }
}
