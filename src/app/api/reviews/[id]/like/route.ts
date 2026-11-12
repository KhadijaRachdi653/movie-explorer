import { NextResponse } from "next/server";
import { toggleLike } from "@/modules/reviews/review.service";
import { reviewIdFrom, type ReviewContext } from "@/modules/reviews/http";
import { requireUserId, toErrorResponse } from "@/modules/discovery/http";

// POST /api/reviews/[id]/like — aimer / ne plus aimer un avis
export async function POST(_request: Request, context: ReviewContext) {
  try {
    const userId = await requireUserId();
    const id = await reviewIdFrom(context);
    return NextResponse.json(await toggleLike(id, userId), { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "POST /api/reviews/[id]/like");
  }
}
