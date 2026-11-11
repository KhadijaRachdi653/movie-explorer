import { NextResponse } from "next/server";
import { addMovieSchema, isValidListId } from "@/modules/recommendations/customList.schema";
import { addMovieToList } from "@/modules/recommendations/customList.service";
import { ApiError, readJson, toErrorResponse } from "@/modules/recommendations/errors";
import { requireUserId } from "@/modules/recommendations/session";

type Context = { params: Promise<{ id: string }> };

// POST /api/lists/[id]/movies — ajouter un film (propriétaire)
export async function POST(request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    if (!isValidListId(id)) throw new ApiError(400, "Identifiant de liste invalide.");
    const movie = addMovieSchema.parse(await readJson(request));
    return NextResponse.json(await addMovieToList(id, userId, movie), { status: 201 });
  } catch (err) {
    return toErrorResponse(err, "POST /api/lists/[id]/movies");
  }
}
