import { NextRequest, NextResponse } from "next/server";
import { recommendationsQuerySchema } from "@/modules/recommendations/customList.schema";
import {
  getPersonalRecommendations,
  getSimilarMovies,
  getTrending,
} from "@/modules/recommendations/recommendation.service";
import { toErrorResponse } from "@/modules/recommendations/errors";
import { getSessionUserId } from "@/modules/recommendations/session";

// GET /api/recommendations?trending=&movieId=&listId=&limit=
// - avec trending=true : tendances de la semaine (public)
// - avec movieId : films similaires (public)
// - avec listId  : recommandations basées sur cette liste (propriétaire, ou liste publique)
// - sinon        : recommandations personnalisées (connecté) ou tendances (non connecté)
export async function GET(request: NextRequest) {
  try {
    const query = recommendationsQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const data = query.trending
      ? await getTrending(query.limit)
      : query.movieId
        ? await getSimilarMovies(query.movieId, query.limit)
        : await getPersonalRecommendations(
            await getSessionUserId(),
            query.limit,
            query.listId,
          );
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "GET /api/recommendations");
  }
}
