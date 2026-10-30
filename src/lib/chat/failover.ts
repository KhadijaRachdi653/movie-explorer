import { APICallError, generateText, streamText } from "ai";
import type { Agent } from "./agents";
import { SUMMARY_PROMPT, buildSystemPrompt } from "./prompts";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AgentInfo = { index: number; total: number; label: string; relay: boolean };

// Messages kept verbatim when we hand a conversation over with a summary.
export const KEEP_RECENT = 8;
// Re-summarise only when at least this many new messages piled up (saves requests).
const SUMMARIZE_BATCH = 6;

export class AllAgentsBusyError extends Error {
  constructor(
    public retryAfterSeconds: number,
    public reason: string = ""
  ) {
    super("Tous les assistants sont occupés.");
    this.name = "AllAgentsBusyError";
  }
}

// An error that is about the request itself, not about an agent's quota.
// Trying other agents would not help, and it must not put agents on cooldown.
export class ChatRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatRequestError";
  }
}

type Briefing = { text: string; covers: number; updatedAt: number };

export type FailoverState = {
  cooldowns: Map<string, number>; // agent id -> timestamp until which it is skipped
  briefings: Map<string, Briefing>; // conversation id -> cached summary
  reasons: Map<string, string>; // agent id -> last failure, for diagnostics
};

export function createState(): FailoverState {
  return { cooldowns: new Map(), briefings: new Map(), reasons: new Map() };
}

// Survives hot reloads in dev; per server instance in production.
const g = globalThis as unknown as { __chatState?: FailoverState };
export const defaultState: FailoverState = (g.__chatState ??= createState());

/* ------------------------------ error handling ----------------------------- */

type Failure = { kind: "retry"; cooldownMs: number } | { kind: "fatal" };

export function classifyError(err: unknown): Failure {
  if (APICallError.isInstance(err)) {
    const status = err.statusCode;
    const body = err.responseBody ?? "";

    if (status === 429) {
      if (/PerDay|per day|daily/i.test(body)) return { kind: "retry", cooldownMs: 10 * 60_000 };
      const m = body.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
      if (m) return { kind: "retry", cooldownMs: Math.ceil(Number(m[1]) * 1000) + 1000 };
      return { kind: "retry", cooldownMs: 60_000 };
    }
    if (status === 400 && /API[ _]key/i.test(body)) return { kind: "retry", cooldownMs: 10 * 60_000 };
    if (status === 400) return { kind: "fatal" };
    if (status === 401 || status === 403) return { kind: "retry", cooldownMs: 10 * 60_000 };
    if (status === 404) return { kind: "retry", cooldownMs: 10 * 60_000 }; // retired / unknown model
    if (status !== undefined && status >= 500) return { kind: "retry", cooldownMs: 30_000 };
  }
  // network error, timeout, unknown: short pause, then try again later
  return { kind: "retry", cooldownMs: 20_000 };
}

function markFailure(state: FailoverState, agent: Agent, err: unknown, now: number): Failure {
  const failure = classifyError(err);
  if (failure.kind === "retry") {
    state.cooldowns.set(agent.id, now + failure.cooldownMs);
  }
  const status = APICallError.isInstance(err) && err.statusCode ? `HTTP ${err.statusCode} - ` : "";
  const reason = status + (err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200));
  state.reasons.set(agent.id, reason);
  console.warn(
    `[chat] agent ${agent.label} unavailable${
      failure.kind === "retry" ? ` for ${Math.round(failure.cooldownMs / 1000)}s` : " (request error)"
    }: ${reason}`
  );
  return failure;
}

function isCoolingDown(state: FailoverState, agent: Agent, now: number) {
  const until = state.cooldowns.get(agent.id);
  return until !== undefined && until > now;
}

function secondsUntilAnyAgentReturns(state: FailoverState, agents: Agent[], now: number) {
  const waits = agents
    .map((a) => (state.cooldowns.get(a.id) ?? 0) - now)
    .filter((ms) => ms > 0);
  return Math.max(1, Math.ceil((waits.length ? Math.min(...waits) : 30_000) / 1000));
}

/* --------------------------------- hand-off -------------------------------- */

function mechanicalBriefing(older: ChatMessage[]): string {
  // Fallback when no agent can write a summary: keep what the user said.
  const said = older
    .filter((m) => m.role === "user")
    .slice(-10)
    .map((m) => `- ${m.content.slice(0, 160)}`);
  return said.length ? `Messages précédents de l'utilisateur :\n${said.join("\n")}` : "";
}

async function summarize(agent: Agent, previous: string | null, older: ChatMessage[]): Promise<string> {
  const transcript = older
    .map((m) => `${m.role === "user" ? "Utilisateur" : "Assistant"} : ${m.content.slice(0, 600)}`)
    .join("\n");
  const { text } = await generateText({
    model: agent.model,
    system: SUMMARY_PROMPT,
    prompt: `${previous ? `Résumé précédent :\n${previous}\n\n` : ""}Nouveaux échanges :\n${transcript}`,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(8000),
  });
  return text.trim();
}

// Builds what the relieving agent receives: a summary of the old part of the
// conversation + the most recent messages. Short conversations are passed whole.
async function buildRelayContext(
  state: FailoverState,
  agent: Agent,
  conversationId: string,
  messages: ChatMessage[],
  now: number
): Promise<{ briefing: string | null; messages: ChatMessage[] }> {
  if (messages.length <= KEEP_RECENT) return { briefing: null, messages };

  const cached = state.briefings.get(conversationId);
  const covers = cached?.covers ?? 0;
  const boundary = messages.length - KEEP_RECENT;
  const fresh = messages.slice(covers, boundary);

  if (cached && fresh.length < SUMMARIZE_BATCH) {
    return { briefing: cached.text, messages: messages.slice(covers) };
  }

  try {
    const text = await summarize(agent, cached?.text ?? null, fresh.length ? fresh : messages.slice(0, boundary));
    state.briefings.set(conversationId, { text, covers: boundary, updatedAt: now });
    if (state.briefings.size > 200) {
      for (const [id, b] of state.briefings) {
        if (now - b.updatedAt > 2 * 3600_000) state.briefings.delete(id);
      }
    }
    return { briefing: text, messages: messages.slice(boundary) };
  } catch (err) {
    console.warn("[chat] summary failed, using fallback briefing:", err instanceof Error ? err.message : err);
    const fallback = cached?.text ?? mechanicalBriefing(messages.slice(0, boundary));
    return { briefing: fallback || null, messages: messages.slice(cached ? covers : boundary) };
  }
}

/* -------------------------------- streaming -------------------------------- */

type Opened = { agent: Agent; first: string; rest: AsyncIterator<string>; getError: () => unknown };

async function openAgent(
  agent: Agent,
  system: string,
  messages: ChatMessage[],
  abortSignal: AbortSignal
): Promise<Opened | { empty: true }> {
  let captured: unknown = null;
  // maxRetries: 0 -> do not wait and retry on a 429: switch agent immediately.
  const result = streamText({
    model: agent.model,
    system,
    messages,
    maxRetries: 0,
    abortSignal,
    onError: ({ error }) => {
      captured = error;
    },
  });
  const it = result.textStream[Symbol.asyncIterator]();

  try {
    for (;;) {
      const r = await it.next();
      if (r.done) {
        if (captured) throw captured;
        return { empty: true };
      }
      if (r.value) return { agent, first: r.value, rest: it, getError: () => captured };
    }
  } catch (err) {
    throw captured ?? err;
  }
}

export type FailoverOptions = {
  agents: Agent[];
  messages: ChatMessage[];
  conversationId: string;
  state?: FailoverState;
  now?: () => number;
  abortSignal?: AbortSignal;
};

export async function streamWithFailover(opts: FailoverOptions): Promise<{
  agent: AgentInfo;
  stream: ReadableStream<Uint8Array>;
}> {
  const { agents, messages, conversationId } = opts;
  const state = opts.state ?? defaultState;
  const clock = opts.now ?? Date.now;
  const abort = new AbortController();
  opts.abortSignal?.addEventListener("abort", () => abort.abort());

  if (agents.length === 0) {
    throw new ChatRequestError("Aucun assistant IA n'est configuré (clé API manquante).");
  }

  const tried = new Set<string>();

  // Opens the next agent that works. `partial` is what was already streamed to
  // the user when the previous agent died mid-answer.
  async function openNext(partial: string): Promise<Opened | null> {
    for (const agent of agents) {
      if (tried.has(agent.id) || isCoolingDown(state, agent, clock())) continue;
      tried.add(agent.id);

      const isRelay = agent.id !== agents[0].id;
      const ctx = isRelay
        ? await buildRelayContext(state, agent, conversationId, messages, clock())
        : { briefing: null, messages };

      try {
        const opened = await openAgent(
          agent,
          buildSystemPrompt({ briefing: ctx.briefing, continuation: partial || null }),
          ctx.messages,
          abort.signal
        );
        if ("empty" in opened) {
          // Model answered nothing (e.g. blocked by a safety filter). Not a quota issue.
          return { agent, first: "Je ne peux pas répondre à cette demande. Peux-tu la reformuler ?", rest: emptyIterator(), getError: () => null };
        }
        return opened;
      } catch (err) {
        if (abort.signal.aborted) throw err;
        const failure = markFailure(state, agent, err, clock());
        if (failure.kind === "fatal") throw new ChatRequestError("La demande n'a pas pu être traitée.");
      }
    }
    return null;
  }

  const firstOpened = await openNext("");
  if (!firstOpened) {
    const reason = agents.map((a) => `${a.label}: ${state.reasons.get(a.id) ?? "en pause"}`).join(" | ");
    throw new AllAgentsBusyError(secondsUntilAnyAgentReturns(state, agents, clock()), reason);
  }

  const info: AgentInfo = {
    index: agents.findIndex((a) => a.id === firstOpened.agent.id) + 1,
    total: agents.length,
    label: firstOpened.agent.label,
    relay: firstOpened.agent.id !== agents[0].id,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sent = "";
      const emit = (t: string) => {
        sent += t;
        controller.enqueue(encoder.encode(t));
      };

      let current: Opened | null = firstOpened;
      try {
        while (current) {
          const active: Opened = current;
          try {
            emit(active.first);
            for (;;) {
              const r = await active.rest.next();
              if (r.done) {
                const late = active.getError();
                if (late) throw late;
                break;
              }
              emit(r.value);
            }
            current = null; // finished normally
          } catch (err) {
            if (abort.signal.aborted) break;
            // The agent died mid-answer: another one continues from where it stopped.
            markFailure(state, active.agent, err, clock());
            current = await openNext(sent);
            if (!current) emit("\n\n(Réponse interrompue, merci de réessayer dans un instant.)");
          }
        }
      } finally {
        try {
          controller.close();
        } catch {
          // already closed because the client left
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return { agent: info, stream };
}

function emptyIterator(): AsyncIterator<string> {
  return { next: async () => ({ done: true, value: undefined }) };
}