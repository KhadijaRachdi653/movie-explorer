import { NextResponse } from "next/server";
import { movieRefSchema, ratingSchema } from "@/modules/reviews/review.schema";
import {
  deleteRating,
  getMyRating,
  getRatingSummary,
  upsertRating,
} from "@/modules/reviews/review.service";
import { getViewer } from "@/modules/reviews/http";
import {
  readJson,
  requireUserId,
  toErrorResponse,
} from "@/modules/discovery/http";

const movieIdFrom = (request: Request) =>
  movieRefSchema.parse(new URL(request.url).searchParams.get("movieId") ?? "");

// GET /api/ratings?movieId=… — moyenne, nombre de notes, répartition 1★…5★ et ma note (R)
export async function GET(request: Request) {
  try {
    const movieId = movieIdFrom(request);
    const viewer = await getViewer();
    const [summary, myScore] = await Promise.all([
      getRatingSummary(movieId),
      viewer ? getMyRating(viewer.id, movieId) : null,
    ]);
    return NextResponse.json({ ...summary, myScore }, { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "GET /api/ratings");
  }
}

// PUT /api/ratings — noter ou modifier sa note { movieId, score } (C/U)
export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const input = ratingSchema.parse(await readJson(request));
    const summary = await upsertRating(userId, input);
    return NextResponse.json(
      { ...summary, myScore: input.score },
      { status: 200 },
    );
  } catch (err) {
    return toErrorResponse(err, "PUT /api/ratings");
  }
}

// DELETE /api/ratings?movieId=… — retirer sa note (D)
export async function DELETE(request: Request) {
  try {
    const userId = await requireUserId();
    const summary = await deleteRating(userId, movieIdFrom(request));
    return NextResponse.json({ ...summary, myScore: null }, { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "DELETE /api/ratings");
  }
}
