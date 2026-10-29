import { NextResponse } from "next/server";
import { isValidListId, updateListSchema } from "@/modules/recommendations/customList.schema";
import { deleteList, getList, updateList } from "@/modules/recommendations/customList.service";
import { ApiError, readJson, toErrorResponse } from "@/modules/recommendations/errors";
import { getSessionUserId, requireUserId } from "@/modules/recommendations/session";

type Context = { params: Promise<{ id: string }> };

async function listIdFrom(context: Context): Promise<string> {
  const { id } = await context.params;
  if (!isValidListId(id)) throw new ApiError(400, "Identifiant de liste invalide.");
  return id;
}

// GET /api/lists/[id] — propriétaire, ou tout le monde si publique
export async function GET(_request: Request, context: Context) {
  try {
    const id = await listIdFrom(context);
    return NextResponse.json(await getList(id, await getSessionUserId()), { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "GET /api/lists/[id]");
  }
}

// PATCH /api/lists/[id] — modifier nom / description / visibilité (propriétaire)
export async function PATCH(request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const id = await listIdFrom(context);
    const input = updateListSchema.parse(await readJson(request));
    return NextResponse.json(await updateList(id, userId, input), { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "PATCH /api/lists/[id]");
  }
}

// DELETE /api/lists/[id] — supprimer (propriétaire)
export async function DELETE(_request: Request, context: Context) {
  try {
    const userId = await requireUserId();
    const id = await listIdFrom(context);
    await deleteList(id, userId);
    return NextResponse.json({ message: "Liste supprimée." }, { status: 200 });
  } catch (err) {
    return toErrorResponse(err, "DELETE /api/lists/[id]");
  }
}
