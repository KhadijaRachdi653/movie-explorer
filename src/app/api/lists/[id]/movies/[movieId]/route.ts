import { NextResponse } from "next/server";
import { isValidListId, movieIdParamSchema } from "@/modules/recommendations/customList.schema";
import { removeMovieFromList } from "@/modules/recommendations/customList.service";
import { ApiError, toErrorResponse } from "@/modules/recommendations/errors";
import { requireUserId } from "@/modules/recommendations/session";

type Context = { params: Promise<{ id: string; movieId: string }> };

// DELETE /api/lists/[id]/movies/[movieId] — retirer un film (propriétaire)
export async function DELETE(_request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const { id, movieId } = await context.params;
    if (!isValidListId(id)) throw new ApiError(400, "Identifiant de liste invalide.");
    const parsedMovieId = movieIdParamSchema.parse(movieId);
    return NextResponse.json(await removeMovieFromList(id, userId, parsedMovieId), { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "DELETE /api/lists/[id]/movies/[movieId]");
  }
}
