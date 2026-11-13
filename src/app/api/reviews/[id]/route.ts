import { NextResponse } from "next/server";
import { updateReviewSchema } from "@/modules/reviews/review.schema";
import { deleteReview, updateReview } from "@/modules/reviews/review.service";
import { getViewer, reviewIdFrom, type ReviewContext } from "@/modules/reviews/http";
import { readJson, requireUserId, toErrorResponse } from "@/modules/discovery/http";

// PATCH /api/reviews/[id] — modifier son avis { content?, spoiler? } (U)
export async function PATCH(request: Request, context: ReviewContext) {
  try {
    const userId = await requireUserId();
    const id = await reviewIdFrom(context);
    const input = updateReviewSchema.parse(await readJson(request));
    return NextResponse.json(await updateReview(id, userId, input), { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "PATCH /api/reviews/[id]");
  }
}

// DELETE /api/reviews/[id] — supprimer son avis (ou n'importe lequel pour un administrateur) (D)
export async function DELETE(_request: Request, context: ReviewContext) {
  try {
    const userId = await requireUserId();
    const id = await reviewIdFrom(context);
    const viewer = await getViewer();
    await deleteReview(id, userId, viewer?.isAdmin);
    return NextResponse.json({ message: "Avis supprimé." }, { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "DELETE /api/reviews/[id]");
  }
}
