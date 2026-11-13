import { NextResponse } from "next/server";
import { adminUpdateSchema, ownerUpdateSchema } from "@/modules/subscriptions/subscription.schema";
import {
  adminUpdate,
  deleteSubscription,
  getSubscription,
  ownerUpdate,
} from "@/modules/subscriptions/subscription.service";
import { requireViewer, subscriptionIdFrom, type SubscriptionContext } from "@/modules/subscriptions/http";
import { ApiError, readJson, toErrorResponse } from "@/modules/discovery/http";

// GET /api/subscriptions/[id] — détail d'un abonnement (propriétaire ou administrateur) (R)
export async function GET(_request: Request, context: SubscriptionContext) {
  try {
    const viewer = await requireViewer();
    const id = await subscriptionIdFrom(context);
    return NextResponse.json(await getSubscription(id, viewer), { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "GET /api/subscriptions/[id]");
  }
}

// PATCH /api/subscriptions/[id] (U)
//  - propriétaire : { action: "change-plan", planName, billingPeriod } ou { action: "cancel" }
//  - administrateur : modification partielle { planName?, description?, price?, billingPeriod?, startDate?, endDate?, status? }
export async function PATCH(request: Request, context: SubscriptionContext) {
  try {
    const viewer = await requireViewer();
    const id = await subscriptionIdFrom(context);
    const body = (await readJson(request)) as Record<string, unknown> | null;
    if (body && typeof body === "object" && "action" in body) {
      return NextResponse.json(await ownerUpdate(id, viewer.id, ownerUpdateSchema.parse(body)), { status: 200 });
    }
    if (!viewer.isAdmin) throw new ApiError(403, "Accès réservé aux administrateurs.");
    return NextResponse.json(await adminUpdate(id, adminUpdateSchema.parse(body), viewer), { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "PATCH /api/subscriptions/[id]");
  }
}

// DELETE /api/subscriptions/[id] — propriétaire (abonnement terminé) ou administrateur (D)
export async function DELETE(_request: Request, context: SubscriptionContext) {
  try {
    const viewer = await requireViewer();
    const id = await subscriptionIdFrom(context);
    await deleteSubscription(id, viewer);
    return NextResponse.json({ message: "Abonnement supprimé." }, { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "DELETE /api/subscriptions/[id]");
  }
}
