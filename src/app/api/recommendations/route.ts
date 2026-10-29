import { NextRequest, NextResponse } from "next/server";
import { recommendationsQuerySchema } from "@/modules/recommendations/customList.schema";
import { getPersonalRecommendations, getSimilarMovies } from "@/modules/recommendations/recommendation.service";
import { toErrorResponse } from "@/modules/recommendations/errors";
import { getSessionUserId } from "@/modules/recommendations/session";

// GET /api/recommendations?movieId=&limit=
// - avec movieId : films similaires (public)
// - sans movieId : recommandations personnalisées (connecté) ou tendances (non connecté)
export async function GET(request: NextRequest) {
  try {
    const query = recommendationsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const data = query.movieId
      ? await getSimilarMovies(query.movieId, query.limit)
      : await getPersonalRecommendations(await getSessionUserId(), query.limit);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "GET /api/recommendations");
  }
}
