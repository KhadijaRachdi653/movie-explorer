import { auth } from "@/lib/auth";
import { ApiError } from "@/modules/discovery/http";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new ApiError(401, "Authentification requise.");
  if ((session.user as { role?: string }).role !== "admin")
    throw new ApiError(403, "Accès réservé aux administrateurs.");
}
