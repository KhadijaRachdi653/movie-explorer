"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  relay?: boolean; // answered by a backup assistant
  isError?: boolean; // local error bubble, never sent back to the API
};

const MAX_INPUT = 500;

// Starter boxes shown at the beginning of a conversation.
// Clicking one fills the message box with an editable sentence. The text in
// [brackets] is pre-selected so the user just types over it, then sends.
const STARTERS: { icon: string; title: string; hint: string; prompt: string }[] = [
  {
    icon: "🔍",
    title: "Retrouver un film",
    hint: "Décrivez-le, je cherche le titre",
    prompt: "Aide-moi à retrouver un film : [ce dont vous vous souvenez]",
  },
  {
    icon: "🎞️",
    title: "Expliquer un film",
    hint: "Intrigue, fin, symboles",
    prompt: "Explique-moi l'intrigue et la fin du film [titre du film]",
  },
  {
    icon: "🍿",
    title: "Un film pour ce soir",
    hint: "Selon votre humeur et votre temps",
    prompt: "Aide-moi à trouver un film à regarder ce soir : [genre, humeur, durée]",
  },
  {
    icon: "❤️",
    title: "Films similaires",
    hint: "À partir de vos films préférés",
    prompt: "J'ai adoré [vos films préférés]. Que me conseilles-tu de regarder ensuite ?",
  },
  {
    icon: "⭐",
    title: "Avis sur un film",
    hint: "Points forts, faiblesses, accueil",
    prompt: "Que penses-tu du film [titre du film] ?",
  },
  {
    icon: "🎲",
    title: "Surprenez-moi",
    hint: "Une pépite que je ne connais pas",
    prompt: "Surprends-moi avec un film que je ne connais probablement pas.",
  },
];

const PLACEHOLDER = /\[[^\]]+\]/;

function uid() {
  return crypto.randomUUID();
}

// Renders **bold**, "- " bullets and line breaks. Works while text is still streaming.
function FormattedText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const bullet = /^\s*[-*•]\s+/.test(line);
        const body = bullet ? line.replace(/^\s*[-*•]\s+/, "") : line;
        const parts = body.split("**");
        return (
          <p key={i} className={`${bullet ? "flex gap-2" : ""} ${i > 0 ? "mt-2" : ""} min-h-[1em]`}>
            {bullet && <span aria-hidden="true">•</span>}
            <span>
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j} className="font-semibold text-white">
                    {part}
                  </strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </span>
          </p>
        );
      })}
    </>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const conversationId = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Let the message box grow with its content (up to ~5 lines).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input, open]);

  const hasPlaceholder = PLACEHOLDER.test(input);

  function fillStarter(prompt: string) {
    setInput(prompt);
    setTimeout(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const start = prompt.indexOf("[");
      const end = prompt.indexOf("]");
      if (start >= 0 && end > start) el.setSelectionRange(start, end + 1);
      else el.setSelectionRange(prompt.length, prompt.length);
    }, 0);
  }

  function newConversation() {
    abortRef.current?.abort();
    conversationId.current = null;
    setMessages([]);
    setInput("");
    setLoading(false);
  }

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || loading) return;

    conversationId.current ??= uid();
    const userMsg: Message = { id: uid(), role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const assistantId = uid();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          conversationId: conversationId.current,
          messages: history
            .filter((m) => !m.isError)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        const base = data?.error ?? "Une erreur est survenue. Réessayez dans un instant.";
        throw new Error(data?.debug ? `${base}\n[dev] ${data.debug}` : base);
      }

      const relay = res.headers.get("X-Chat-Relay") === "1";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        // { stream: true } keeps accented (multi-byte) characters intact across chunks
        answer += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next: Message = { id: assistantId, role: "assistant", content: answer, relay };
          return prev.some((m) => m.id === assistantId)
            ? prev.map((m) => (m.id === assistantId ? next : m))
            : [...prev, next];
        });
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // user pressed Stop or reset
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      const content = offline
        ? "Vous êtes hors ligne. CinéBot a besoin d'une connexion internet."
        : err instanceof TypeError
          ? "Connexion impossible. Vérifiez votre réseau et réessayez."
          : (err as Error).message;
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", content, isError: true }]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (hasPlaceholder) return;
    void send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!hasPlaceholder) void send(input);
    }
    if (e.key === "Escape") setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir CinéBot, l'assistant cinéma"
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z" />
          <path d="M9 10h6M9 14h4" />
        </svg>
      </button>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <section
      role="dialog"
      aria-label="CinéBot, assistant cinéma"
      className="fixed bottom-4 right-4 z-50 flex h-[34rem] max-h-[calc(100vh-2rem)] w-[24rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
    >
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">CinéBot</h2>
          <p className="text-xs text-slate-400">Votre assistant cinéma</p>
        </div>
        <div className="flex items-center gap-1">
          {hasMessages && (
            <button
              type="button"
              onClick={newConversation}
              className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            >
              Nouvelle discussion
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {!hasMessages && (
          <div>
            <p className="text-sm font-medium text-slate-100">Bonjour ! Que voulez-vous faire ?</p>
            <p className="mt-1 text-xs text-slate-400">
              Choisissez une idée, complétez la phrase, puis envoyez.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {STARTERS.map((st) => (
                <button
                  key={st.title}
                  type="button"
                  onClick={() => fillStarter(st.prompt)}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-left transition hover:border-blue-500/60 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  <span aria-hidden="true" className="text-lg leading-none">
                    {st.icon}
                  </span>
                  <span className="mt-2 block text-sm font-medium text-slate-100">{st.title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-400">{st.hint}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start"}>
            {m.relay && (
              <span className="mb-1 text-[11px] text-slate-500">Un assistant de secours a pris le relais</span>
            )}
            <div
              className={`max-w-[85%] break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-blue-600 text-white"
                  : m.isError
                    ? "rounded-bl-md border border-red-500/30 bg-red-950/30 text-red-200"
                    : "rounded-bl-md bg-slate-800 text-slate-200"
              }`}
            >
              {m.role === "assistant" ? <FormattedText text={m.content} /> : m.content}
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="text-xs text-slate-500">CinéBot réfléchit…</div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="border-t border-slate-800 p-3">
        <div className="flex items-end gap-2">
          <label htmlFor="chatbot-input" className="sr-only">
            Votre message
          </label>
          <textarea
            id="chatbot-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={MAX_INPUT}
            rows={1}
            placeholder="Posez votre question sur un film…"
            className="max-h-28 min-h-10 flex-1 resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
          {loading ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="h-10 rounded-lg bg-slate-700 px-3 text-sm font-medium text-white hover:bg-slate-600"
            >
              Arrêter
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || hasPlaceholder}
              className="h-10 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              Envoyer
            </button>
          )}
        </div>
        <p className={`mt-2 text-[11px] ${hasPlaceholder ? "text-amber-400" : "text-slate-500"}`}>
          {hasPlaceholder
            ? "Remplacez le texte entre crochets avant d'envoyer."
            : "CinéBot peut se tromper : vérifiez les informations importantes."}
        </p>
      </form>
    </section>
  );
}