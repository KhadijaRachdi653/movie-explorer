import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isValidSavedSearchId } from "@/modules/discovery/savedSearch.schema";
import { runSavedSearch } from "@/modules/discovery/savedSearch.service";
import { ApiError, requireUserId, toErrorResponse } from "@/modules/discovery/http";

type Context = { params: Promise<{ id: string }> };

const pageSchema = z.coerce.number().int().min(1, "Page invalide.").max(500, "Page maximale : 500.").default(1);

// GET /api/saved-searches/[id]/results?page= — relance la recherche enregistrée sur TMDB
export async function GET(request: NextRequest, context: Context) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    if (!isValidSavedSearchId(id)) throw new ApiError(400, "Identifiant de recherche invalide.");
    const page = pageSchema.parse(request.nextUrl.searchParams.get("page") ?? undefined);
    return NextResponse.json(await runSavedSearch(id, userId, page), { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "GET /api/saved-searches/[id]/results");
  }
}
