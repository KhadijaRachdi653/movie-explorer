// Appels à l'API depuis le navigateur (toujours des données fraîches)

export class ApiClientError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init?.method ?? "GET",
      cache: "no-store",
      headers: init?.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiClientError(0, "Pas de connexion. Vérifiez votre réseau puis réessayez.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error ?? "Une erreur est survenue. Réessayez.";
    throw new ApiClientError(res.status, message);
  }
  return data as T;
}
