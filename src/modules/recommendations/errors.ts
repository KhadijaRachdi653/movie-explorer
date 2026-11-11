import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Erreur métier portant un code HTTP
export class ApiError extends Error {
  constructor(public status: number, message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

export const DATABASE_UNAVAILABLE = "La base de données ne répond pas. Vérifiez votre connexion internet puis réessayez.";
export const MOVIES_UNAVAILABLE = "Le service de films ne répond pas. Vérifiez votre connexion internet puis réessayez.";

// Erreurs de connexion à MongoDB (réseau coupé, IP refusée par Atlas, serveur injoignable…)
const MONGO_CONNECTION_ERRORS = new Set([
  "MongooseServerSelectionError",
  "MongoServerSelectionError",
  "MongoNetworkError",
  "MongoNetworkTimeoutError",
  "MongoTopologyClosedError",
]);

export function isDatabaseUnavailable(err: unknown): boolean {
  const name = (err as { name?: string } | null)?.name;
  const causeName = ((err as { cause?: { name?: string } } | null)?.cause)?.name;
  return MONGO_CONNECTION_ERRORS.has(name ?? "") || MONGO_CONNECTION_ERRORS.has(causeName ?? "");
}

// Convertit n'importe quelle erreur en réponse JSON { error } avec le bon code
export function toErrorResponse(err: unknown, context: string): NextResponse {
  if (err instanceof ApiError) {
    if (err.status >= 500) console.error(`Erreur ${context} :`, err.message, err.cause ?? "");
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  // Service externe injoignable : le serveur fonctionne, c'est une dépendance qui manque → 503
  if (isDatabaseUnavailable(err)) {
    console.error(`Erreur ${context} (MongoDB injoignable) :`, err);
    return NextResponse.json({ error: DATABASE_UNAVAILABLE }, { status: 503 });
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
