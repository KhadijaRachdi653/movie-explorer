import { auth } from "@/lib/auth";
import { getAgents } from "@/lib/chat/agents";
import { AllAgentsBusyError, ChatRequestError, streamWithFailover } from "@/lib/chat/failover";
import { checkRateLimit } from "@/lib/chat/rateLimit";
import { parseChatBody } from "@/lib/chat/validate";

export const maxDuration = 30;

const humanDelay = (s: number) => (s < 90 ? `${s} s` : `${Math.ceil(s / 60)} min`);

const json = (data: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });

export async function POST(req: Request) {
  // 1. Only logged-in users (protects the API quota)
  const session = await auth();
  if (!session?.user?.id) {
    return json({ error: "Connectez-vous pour discuter avec CinéBot." }, 401);
  }

  // 2. Per-user rate limit
  const limit = checkRateLimit(session.user.id);
  if (!limit.ok) {
    return json(
      { error: `Doucement ! Réessayez dans ${limit.retryAfterSeconds} s.`, retryAfter: limit.retryAfterSeconds },
      429,
      { "Retry-After": String(limit.retryAfterSeconds) }
    );
  }

  // 3. Validate input
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requête invalide." }, 400);
  }
  const parsed = parseChatBody(body);
  if ("error" in parsed) return json({ error: parsed.error }, 400);

  // 4. Stream the answer, switching agent if one reaches its limit
  try {
    const { agent, stream } = await streamWithFailover({
      agents: getAgents(),
      messages: parsed.messages,
      conversationId: parsed.conversationId,
      abortSignal: req.signal,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
        "X-Chat-Agent": String(agent.index),
        "X-Chat-Agents": String(agent.total),
        "X-Chat-Relay": agent.relay ? "1" : "0",
      },
    });
  } catch (err) {
    if (err instanceof AllAgentsBusyError) {
      return json(
        {
          error: `CinéBot est très sollicité en ce moment. Réessayez dans environ ${humanDelay(err.retryAfterSeconds)}.`,
          retryAfter: err.retryAfterSeconds,
          // Real cause (HTTP status + Google's message). Only shown while developing.
          ...(process.env.NODE_ENV !== "production" && { debug: err.reason }),
        },
        503,
        { "Retry-After": String(err.retryAfterSeconds) }
      );
    }
    if (err instanceof ChatRequestError) return json({ error: err.message }, 400);
    console.error("[chat] unexpected error:", err);
    return json({ error: "Erreur lors de la communication avec l'IA." }, 500);
  }
}