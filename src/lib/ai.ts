import { google } from "@ai-sdk/google";
import type { LanguageModel, TextStreamPart, ToolSet } from "ai";

// Modèles Gemini essayés dans l'ordre : CHAT_MODELS (.env.local, séparés par des virgules) puis les modèles de secours.
// En offre gratuite chaque modèle a son propre quota journalier : la chaîne prend le relais quand l'un est épuisé.
const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];

// Délai max par modèle avant le premier mot (appels d'outils compris) ; au-delà, il est jugé indisponible
const FIRST_TEXT_TIMEOUT_MS = 25_000;

// Un modèle en échec est mis de côté pour ne pas faire attendre chaque message : 5 min (surcharge, délai), 1 h (quota épuisé)
const COOLDOWN_MS = 5 * 60_000;
const QUOTA_COOLDOWN_MS = 60 * 60_000;
// Conservé sur globalThis pour survivre au rechargement à chaud en développement
const unavailableUntil: Map<string, number> = ((globalThis as { geminiCooldown?: Map<string, number> }).geminiCooldown ??=
  new Map());

function markUnavailable(id: string, err: unknown) {
  const quotaExceeded = (err as { statusCode?: number } | null)?.statusCode === 429;
  unavailableUntil.set(id, Date.now() + (quotaExceeded ? QUOTA_COOLDOWN_MS : COOLDOWN_MS));
  console.warn(`Gemini ${id} indisponible :`, err instanceof Error ? err.message : err);
}

export function geminiModelIds(): string[] {
  const configured = (process.env.CHAT_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const all = [...new Set([...configured, ...FALLBACK_MODELS])];
  const ready = all.filter((id) => (unavailableUntil.get(id) ?? 0) < Date.now());
  return ready.length ? ready : all;
}

// Exécute `run` avec le premier modèle disponible (surcharge, quota, modèle retiré → modèle suivant)
export async function withGemini<T>(run: (model: LanguageModel, abortSignal: AbortSignal) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const id of geminiModelIds()) {
    try {
      return await run(google(id), AbortSignal.timeout(FIRST_TEXT_TIMEOUT_MS));
    } catch (err) {
      lastError = err;
      markUnavailable(id, err);
    }
  }
  throw lastError;
}

// Le modèle a répondu sans texte (ex. après des appels d'outils) : il reste disponible
export class EmptyResponseError extends Error {
  constructor() {
    super("Réponse vide.");
  }
}

// Variante streaming (chat) : on passe au modèle suivant tant qu'aucun texte n'a été envoyé au client
export async function streamWithGemini(
  start: (model: LanguageModel, abortSignal: AbortSignal) => { fullStream: AsyncIterable<TextStreamPart<ToolSet>> }
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  let lastError: unknown = new Error("Aucun modèle Gemini configuré.");
  for (const id of geminiModelIds()) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(new Error("Délai dépassé.")), FIRST_TEXT_TIMEOUT_MS);
    const parts = start(google(id), abort.signal).fullStream[Symbol.asyncIterator]();
    let first: string | null = null;
    try {
      while (first === null) {
        const { done, value } = await parts.next();
        if (done) throw new EmptyResponseError();
        if (value.type === "error") throw value.error;
        if (value.type === "abort") throw new Error("Délai dépassé.");
        if (value.type === "text-delta" && value.text) first = value.text;
      }
    } catch (err) {
      lastError = err;
      if (!(err instanceof EmptyResponseError)) markUnavailable(id, err);
      await parts.return?.();
      continue;
    } finally {
      clearTimeout(timer);
    }
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(first));
      },
      // Chaque appel doit envoyer du texte ou fermer le flux, sinon le lecteur reste bloqué
      async pull(controller) {
        while (true) {
          const { done, value } = await parts.next();
          if (done) return controller.close();
          if (value.type === "text-delta" && value.text) return controller.enqueue(encoder.encode(value.text));
          if (value.type === "error" || value.type === "abort") {
            controller.enqueue(encoder.encode("\n\n⚠️ Réponse interrompue, réessayez."));
            return controller.close();
          }
        }
      },
      async cancel() {
        await parts.return?.();
      },
    });
  }
  throw lastError;
}
