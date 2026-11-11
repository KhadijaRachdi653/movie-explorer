import { auth } from "@/lib/auth";
import { ApiError } from "@/modules/discovery/http";
import { isValidReviewId } from "./review.schema";

// Utilisateur connecté (facultatif) : sert à marquer « mes avis » et « j'aime » en lecture
export async function getViewer(): Promise<{ id: string; isAdmin: boolean } | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return { id, isAdmin: (session.user as { role?: string }).role === "admin" };
}

export type ReviewContext = { params: Promise<{ id: string }> };

export async function reviewIdFrom(context: ReviewContext): Promise<string> {
  const { id } = await context.params;
  if (!isValidReviewId(id)) throw new ApiError(400, "Identifiant d'avis invalide.");
  return id;
}
