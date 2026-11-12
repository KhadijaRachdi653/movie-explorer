import { NextResponse } from "next/server";
import {
  createReviewSchema,
  listReviewsSchema,
} from "@/modules/reviews/review.schema";
import { createReview, listReviews } from "@/modules/reviews/review.service";
import { getViewer } from "@/modules/reviews/http";
import {
  readJson,
  requireUserId,
  toErrorResponse,
} from "@/modules/discovery/http";

// GET /api/reviews?movieId=…&sort=recent|likes|highest|lowest&page=1&limit=10 — avis d'un film (R)
export async function GET(request: Request) {
  try {
    const input = listReviewsSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const viewer = await getViewer();
    return NextResponse.json(await listReviews(input, viewer?.id), {
      status: 200,
    });
  } catch (err) {
    return toErrorResponse(err, "GET /api/reviews");
  }
}

// POST /api/reviews — publier un avis { movieId, content, spoiler? } (C)
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = createReviewSchema.parse(await readJson(request));
    return NextResponse.json(await createReview(userId, input), {
      status: 201,
    });
  } catch (err) {
    return toErrorResponse(err, "POST /api/reviews");
  }
}
