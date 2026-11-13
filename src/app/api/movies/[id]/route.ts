import { NextResponse } from "next/server";
import { isValidMovieId, updateMovieSchema } from "@/modules/movies/movie.schema";
import { deleteMovie, getMovie, updateMovie } from "@/modules/movies/movie.service";
import { requireAdmin } from "@/modules/movies/adminGuard";
import { ApiError, readJson, toErrorResponse } from "@/modules/discovery/http";

type Context = { params: Promise<{ id: string }> };

async function idFrom(context: Context) {
  const { id } = await context.params;
  if (!isValidMovieId(id)) throw new ApiError(400, "Identifiant de film invalide.");
  return id;
}

export async function GET(_request: Request, context: Context) {
  try {
    return NextResponse.json(await getMovie(await idFrom(context)));
  } catch (err) {
    return toErrorResponse(err, "GET /api/movies/[id]");
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    await requireAdmin();
    const id = await idFrom(context);
    const input = updateMovieSchema.parse(await readJson(request));
    return NextResponse.json(await updateMovie(id, input));
  } catch (err) {
    return toErrorResponse(err, "PATCH /api/movies/[id]");
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    await requireAdmin();
    await deleteMovie(await idFrom(context));
    return NextResponse.json({ message: "Film supprimé." });
  } catch (err) {
    return toErrorResponse(err, "DELETE /api/movies/[id]");
  }
}
