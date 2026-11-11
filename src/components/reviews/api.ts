// Appels aux routes du Module 3 depuis les composants client ; renvoie le message d'erreur de l'API s'il y en a un
export async function reviewsApi(url: string, method: string, body?: unknown): Promise<{ error?: string; data?: unknown }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return { error: "Connectez-vous pour continuer." };
    if (!res.ok) return { error: (data as { error?: string }).error ?? "Une erreur est survenue." };
    return { data };
  } catch {
    return { error: "Connexion impossible. Vérifiez votre réseau." };
  }
}

export function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
    [Infinity, "year"],
  ];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return rtf.format(-Math.round(value), unit);
    value /= size;
  }
  return "";
}
