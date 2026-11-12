import { NextResponse } from "next/server";
import { reportSchema } from "@/modules/reviews/review.schema";
import { reportReview } from "@/modules/reviews/review.service";
import { reviewIdFrom, type ReviewContext } from "@/modules/reviews/http";
import {
  readJson,
  requireUserId,
  toErrorResponse,
} from "@/modules/discovery/http";

// POST /api/reviews/[id]/report — signaler un avis inapproprié { reason }
export async function POST(request: Request, context: ReviewContext) {
  try {
    const userId = await requireUserId();
    const id = await reviewIdFrom(context);
    const { reason } = reportSchema.parse(await readJson(request));
    await reportReview(id, userId, reason);
    return NextResponse.json(
      { message: "Merci, l'avis a été signalé." },
      { status: 201 },
    );
  } catch (err) {
    return toErrorResponse(err, "POST /api/reviews/[id]/report");
  }
}
