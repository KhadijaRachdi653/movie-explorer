import { NextResponse } from "next/server";
import { createSavedSearchSchema } from "@/modules/discovery/savedSearch.schema";
import { createSavedSearch, getUserSavedSearches } from "@/modules/discovery/savedSearch.service";
import { readJson, requireUserId, toErrorResponse } from "@/modules/discovery/http";

// GET /api/saved-searches — recherches sauvegardées de l'utilisateur connecté (R)
export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json({ savedSearches: await getUserSavedSearches(userId) }, { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "GET /api/saved-searches");
  }
}

// POST /api/saved-searches — sauvegarder une recherche (C)
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = createSavedSearchSchema.parse(await readJson(request));
    return NextResponse.json(await createSavedSearch(userId, input), { status: 201 });
  } catch (err) {
    return toErrorResponse(err, "POST /api/saved-searches");
  }
}
