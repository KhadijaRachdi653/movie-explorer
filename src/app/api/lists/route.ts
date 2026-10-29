import { NextResponse } from "next/server";
import { createListSchema } from "@/modules/recommendations/customList.schema";
import { createList, getUserLists } from "@/modules/recommendations/customList.service";
import { readJson, toErrorResponse } from "@/modules/recommendations/errors";
import { requireUserId } from "@/modules/recommendations/session";

// GET /api/lists — listes de l'utilisateur connecté
export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json({ lists: await getUserLists(userId) }, { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "GET /api/lists");
  }
}

// POST /api/lists — créer une liste
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = createListSchema.parse(await readJson(request));
    return NextResponse.json(await createList(userId, input), { status: 201 });
  } catch (err) {
    return toErrorResponse(err, "POST /api/lists");
  }
}
