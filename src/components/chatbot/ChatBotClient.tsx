"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Message = { id: string; content: string; role: "user" | "assistant" };

const STORAGE_KEY = "cinebot-conversation";

type SavedConversation = { owner: string; messages: Message[] };

// Conversation enregistrée, seulement si elle appartient au compte affiché
function loadSaved(owner: string): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as SavedConversation | null;
    return saved?.owner === owner ? saved.messages : [];
  } catch {
    return [];
  }
}

const GENERAL_SUGGESTIONS = ["🎬 Un film pour ce soir ?", "⭐ Les mieux notés par la communauté", "🔎 Tu as des films de Nolan ?"];
const MOVIE_SUGGESTIONS = ["💬 Que pensent les gens de ce film ?", "🎞️ Des films dans le même genre ?"];

// Rend les liens markdown [titre](/movies/…) et le **gras** produits par CineBot
function renderInline(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*)/g).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, href] = link;
      return href.startsWith("/") ? (
        <Link key={i} href={href} className="font-medium text-blue-300 underline underline-offset-2 hover:text-blue-200">
          {label}
        </Link>
      ) : (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">
          {label}
        </a>
      );
    }
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

// owner : e-mail du compte connecté ("" pour un visiteur), fourni par le serveur (voir ChatBot.tsx)
export default function ChatBotClient({ owner }: { owner: string }) {
  const pathname = usePathname();
  const currentMovieId = pathname.match(/^\/movies\/([a-f\d]{24})/i)?.[1];
  const [isOpen, setIsOpen] = useState(false);
  // La conversation est conservée pendant la session de navigation, pour ce compte uniquement
  const [messages, setMessages] = useState<Message[]>(() => loadSaved(owner));
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ owner, messages }));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [owner, messages, isOpen]);

  async function send(text: string) {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = { id: crypto.randomUUID(), content: text.trim(), role: "user" };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          currentMovieId,
        }),
      });
      if (!response.ok || !response.body) throw new Error(await response.text());

      // Lecture du flux texte au fil de l'eau (streaming, comme dans le Workshop 5)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const assistantId = crypto.randomUUID();
      let assistantMessage = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // { stream: true } évite de corrompre les caractères accentués (UTF-8 multi-octets)
        assistantMessage += decoder.decode(value, { stream: true });
        const content = assistantMessage;
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === assistantId);
          if (exists) return prev.map((m) => (m.id === assistantId ? { ...m, content } : m));
          return [...prev, { id: assistantId, content, role: "assistant" }];
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      const detail = error instanceof Error && error.message ? error.message : "";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          content: detail.length > 0 && detail.length < 200 ? detail : "Désolé, une erreur est survenue. Réessayez dans un instant.",
          role: "assistant",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const suggestions = currentMovieId ? [...MOVIE_SUGGESTIONS, ...GENERAL_SUGGESTIONS.slice(0, 1)] : GENERAL_SUGGESTIONS;
  const waitingFirstWord = isLoading && messages.at(-1)?.role === "user";

  return (
    <div className="fixed bottom-4 right-4 z-50 text-[var(--ink)]">
      {isOpen ? (
        <div
          role="dialog"
          aria-label="CineBot, assistant cinéma"
          className="flex h-[min(600px,calc(100vh-2rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[var(--edge)] bg-[var(--deep)] shadow-2xl shadow-black/60"
        >
          {/* En-tête */}
          <div className="flex items-center gap-3 border-b border-[var(--edge)] bg-[radial-gradient(ellipse_at_top_left,rgba(242,181,68,0.22),transparent_70%)] px-4 py-3.5">
            <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--marquee)] text-lg shadow-lg shadow-black/40">🎬</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold leading-tight">CineBot</h3>
              <p className="flex items-center gap-1.5 text-xs text-[var(--mist)]">
                <span aria-hidden className="size-1.5 rounded-full bg-green-400" /> Assistant cinéma, propulsé par Gemini
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                title="Nouvelle conversation"
                aria-label="Nouvelle conversation"
                className="rounded-md px-2 py-1.5 text-sm text-[var(--mist)] hover:bg-white/10 hover:text-[var(--ink)]"
              >
                ↺
              </button>
            )}
            <button onClick={() => setIsOpen(false)} aria-label="Fermer CineBot" className="rounded-md px-2 py-1 text-xl text-[var(--mist)] hover:bg-white/10 hover:text-[var(--ink)]">
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.length === 0 && (
              <div className="mt-2 space-y-5">
                <div>
                  <p className="text-lg font-bold">Bonjour 👋</p>
                  <p className="mt-1 text-sm text-[var(--mist)]">Je connais tout le catalogue et les avis de la communauté. Que puis-je pour vous ?</p>
                </div>
                <div className="flex flex-col gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s.replace(/^\S+\s/, ""))}
                      className="rounded-lg border border-[var(--edge)] bg-[var(--night)] px-3.5 py-2.5 text-left text-sm transition-colors hover:border-[var(--marquee)] hover:text-[var(--marquee)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-[var(--marquee)] text-[#1a1203]"
                      : "rounded-bl-sm border border-[var(--edge)] bg-[var(--night)] text-[var(--ink)]"
                  }`}
                >
                  {msg.role === "assistant" ? renderInline(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {waitingFirstWord && (
              <div className="flex items-center gap-2 text-sm text-[var(--mist)]" role="status">
                <span className="flex gap-1" aria-hidden>
                  <span className="size-1.5 animate-bounce rounded-full bg-[var(--marquee)]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-[var(--marquee)] [animation-delay:150ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-[var(--marquee)] [animation-delay:300ms]" />
                </span>
                CineBot réfléchit…
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Saisie */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-[var(--edge)] p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={2000}
              aria-label="Votre message"
              placeholder={currentMovieId ? "Une question sur ce film ?" : "Demandez un film, un avis…"}
              className="flex-1 rounded-full border border-[var(--edge)] bg-[var(--night)] px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--mist)]/60 focus:border-[var(--marquee)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Envoyer"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--marquee)] text-lg font-bold text-[#1a1203] transition-colors hover:bg-[#f7c766] disabled:opacity-40"
            >
              <span aria-hidden>↑</span>
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex h-14 items-center gap-2 rounded-full bg-[var(--marquee)] pl-4 pr-5 font-semibold text-[#1a1203] shadow-xl shadow-black/50 transition-transform hover:-translate-y-0.5"
          aria-label="Ouvrir CineBot, l'assistant cinéma"
        >
          <span aria-hidden className="text-xl">🎬</span>
          <span className="hidden sm:inline">Demander à CineBot</span>
        </button>
      )}
    </div>
  );
}
