import { NextResponse } from "next/server";
import { listSchema, movieSchema } from "@/modules/movies/movie.schema";
import { createMovie, listMovies } from "@/modules/movies/movie.service";
import { requireAdmin } from "@/modules/movies/adminGuard";
import { readJson, toErrorResponse } from "@/modules/discovery/http";

export async function GET(request: Request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const { page, limit } = listSchema.parse(params);
    return NextResponse.json(await listMovies(page, limit));
  } catch (err) {
    return toErrorResponse(err, "GET /api/movies");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = movieSchema.parse(await readJson(request));
    return NextResponse.json(await createMovie(input), { status: 201 });
  } catch (err) {
    return toErrorResponse(err, "POST /api/movies");
  }
}
