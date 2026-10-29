import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Erreur métier portant un code HTTP
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Convertit n'importe quelle erreur en réponse JSON { error } avec le bon code
export function toErrorResponse(err: unknown, context: string): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
  }
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    return NextResponse.json({ error: "Vous avez déjà une liste avec ce nom." }, { status: 409 });
  }
  console.error(`Erreur ${context} :`, err);
  return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
}

// Lit le corps JSON d'une requête (400 si invalide)
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "Corps de requête JSON invalide.");
  }
}
