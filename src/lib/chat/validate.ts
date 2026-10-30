import type { ChatMessage } from "./failover";

export const MAX_MESSAGES = 30;
export const MAX_CONTENT_LENGTH = 2000;

export type ParsedChatBody = { conversationId: string; messages: ChatMessage[] };

// Never trust the client: check shape, roles and sizes.
export function parseChatBody(body: unknown): ParsedChatBody | { error: string } {
  if (typeof body !== "object" || body === null) return { error: "Requête invalide." };
  const { conversationId, messages } = body as Record<string, unknown>;

  if (typeof conversationId !== "string" || !/^[\w-]{8,64}$/.test(conversationId)) {
    return { error: "Identifiant de conversation invalide." };
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: "Aucun message." };
  }

  const clean: ChatMessage[] = [];
  for (const m of messages.slice(-MAX_MESSAGES)) {
    if (typeof m !== "object" || m === null) return { error: "Message invalide." };
    const { role, content } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      return { error: "Message invalide." };
    }
    const text = content.trim().slice(0, MAX_CONTENT_LENGTH);
    if (text) clean.push({ role, content: text });
  }

  // Gemini requires the conversation to start with a user turn.
  while (clean.length > 0 && clean[0].role !== "user") clean.shift();
  if (clean.length === 0 || clean[clean.length - 1].role !== "user") {
    return { error: "Le dernier message doit venir de l'utilisateur." };
  }
  return { conversationId, messages: clean };
}