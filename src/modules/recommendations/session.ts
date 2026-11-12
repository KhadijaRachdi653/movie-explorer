import { auth } from "@/lib/auth";
import { ApiError } from "./errors";

// L'utilisateur est toujours identifié via la session vérifiée, jamais via le client

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new ApiError(401, "Authentification requise.");
  return userId;
}
