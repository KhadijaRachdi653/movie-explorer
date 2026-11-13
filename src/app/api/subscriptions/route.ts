import { NextResponse } from "next/server";
import { adminCreateSchema, listSubscriptionsSchema, subscribeSchema } from "@/modules/subscriptions/subscription.schema";
import { adminCreate, listSubscriptions, subscribe } from "@/modules/subscriptions/subscription.service";
import { requireViewer } from "@/modules/subscriptions/http";
import { ApiError, readJson, toErrorResponse } from "@/modules/discovery/http";

// GET /api/subscriptions?q=&status=&billingPeriod=&planName=&sort=&page=&limit=&scope=mine|all
// Liste paginée, recherche et filtres (R). scope=all : toute la plateforme (administrateur).
export async function GET(request: Request) {
  try {
    const viewer = await requireViewer();
    const input = listSubscriptionsSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json(await listSubscriptions(input, viewer), { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "GET /api/subscriptions");
  }
}

// POST /api/subscriptions (C)
//  - utilisateur : { planName, billingPeriod } → souscription à une offre du catalogue
//  - administrateur : { userEmail, planName, description?, price, billingPeriod, startDate, endDate?, status }
export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const body = (await readJson(request)) as Record<string, unknown> | null;
    if (body && typeof body === "object" && "userEmail" in body) {
      if (!viewer.isAdmin) throw new ApiError(403, "Accès réservé aux administrateurs.");
      return NextResponse.json(await adminCreate(adminCreateSchema.parse(body), viewer), { status: 201 });
    }
    return NextResponse.json(await subscribe(viewer.id, subscribeSchema.parse(body)), { status: 201 });
  } catch (err) {
    return toErrorResponse(err, "POST /api/subscriptions");
  }
}
