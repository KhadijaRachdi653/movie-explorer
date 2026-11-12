import { ApiError } from "@/modules/discovery/http";
import { getViewer } from "@/modules/reviews/http";
import { isValidSubscriptionId } from "./subscription.schema";
import type { Viewer } from "./subscription.service";

// Toutes les routes du Module 2 exigent un utilisateur connecté
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new ApiError(401, "Authentification requise.");
  return viewer;
}

export type SubscriptionContext = { params: Promise<{ id: string }> };

export async function subscriptionIdFrom(context: SubscriptionContext): Promise<string> {
  const { id } = await context.params;
  if (!isValidSubscriptionId(id)) throw new ApiError(400, "Identifiant d'abonnement invalide.");
  return id;
}
