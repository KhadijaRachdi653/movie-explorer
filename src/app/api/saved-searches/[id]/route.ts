import { NextResponse } from "next/server";
import { isValidSavedSearchId, updateSavedSearchSchema } from "@/modules/discovery/savedSearch.schema";
import { deleteSavedSearch, getSavedSearch, updateSavedSearch } from "@/modules/discovery/savedSearch.service";
import { ApiError, readJson, requireUserId, toErrorResponse } from "@/modules/discovery/http";

type Context = { params: Promise<{ id: string }> };

async function idFrom(context: Context): Promise<string> {
  const { id } = await context.params;
  if (!isValidSavedSearchId(id)) throw new ApiError(400, "Identifiant de recherche invalide.");
  return id;
}

// GET /api/saved-searches/[id] — détail (R)
export async function GET(_request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const id = await idFrom(context);
    return NextResponse.json(await getSavedSearch(id, userId), { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "GET /api/saved-searches/[id]");
  }
}

// PATCH /api/saved-searches/[id] — modifier nom et/ou filtres (U)
export async function PATCH(request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const id = await idFrom(context);
    const input = updateSavedSearchSchema.parse(await readJson(request));
    return NextResponse.json(await updateSavedSearch(id, userId, input), { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "PATCH /api/saved-searches/[id]");
  }
}

// DELETE /api/saved-searches/[id] — supprimer (D)
export async function DELETE(_request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const id = await idFrom(context);
    await deleteSavedSearch(id, userId);
    return NextResponse.json({ message: "Recherche sauvegardée supprimée." }, { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "DELETE /api/saved-searches/[id]");
  }
}
