"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Message = { id: string; content: string; role: "user" | "assistant" };

const STORAGE_KEY = "cinebot-conversation";

type SavedConversation = { owner: string; messages: Message[] };

function loadSaved(): SavedConversation | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as SavedConversation | null;
  } catch {
    return null;
  }
}

// E-mail du compte connecté, "" pour un visiteur, null si la session n'a pas pu être lue
async function fetchSessionUser(): Promise<string | null> {
  try {
    const session = (await fetch("/api/auth/session").then((r) => r.json())) as { user?: { email?: string } } | null;
    return session?.user?.email ?? "";
  } catch {
    return null;
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

export default function ChatBot() {
  const pathname = usePathname();
  const currentMovieId = pathname.match(/^\/movies\/([a-f\d]{24})/i)?.[1];
  const [isOpen, setIsOpen] = useState(false);
  // La conversation est conservée pendant la session de navigation
  const [messages, setMessages] = useState<Message[]>(() => loadSaved()?.messages ?? []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ownerRef = useRef<string | null>(null); // compte auquel appartient la conversation affichée

  // La conversation appartient au compte connecté : après une déconnexion ou un changement de compte, CineBot repart de zéro
  const syncOwner = useCallback(async (): Promise<boolean> => {
    const user = await fetchSessionUser();
    if (user === null) return false; // session illisible (hors ligne) : on ne touche à rien
    const previous = ownerRef.current ?? loadSaved()?.owner ?? user;
    ownerRef.current = user;
    if (previous === user) return false;
    sessionStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    setInput("");
    return true;
  }, []);

  useEffect(() => {
    syncOwner().then((reset) => reset && setIsOpen(false));
  }, [pathname, syncOwner]);

  useEffect(() => {
    if (ownerRef.current !== null) sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ owner: ownerRef.current, messages }));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  async function open() {
    await syncOwner();
    setIsOpen(true);
  }

  async function send(text: string) {
    if (!text.trim() || isLoading) return;
    const history = (await syncOwner()) ? [] : messages;
    const userMessage: Message = { id: crypto.randomUUID(), content: text.trim(), role: "user" };
    const updatedMessages = [...history, userMessage];
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
    <div className="fixed bottom-4 right-4 z-50 text-slate-100">
      {isOpen ? (
        <div className="flex h-[min(560px,calc(100vh-2rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
            <div>
              <h3 className="font-semibold">CineBot 🎬</h3>
              <p className="text-xs text-blue-100">Votre assistant cinéma · Gemini</p>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title="Nouvelle conversation"
                  className="rounded px-2 py-1 text-sm hover:bg-blue-800"
                >
                  🗑️
                </button>
              )}
              <button onClick={() => setIsOpen(false)} aria-label="Fermer" className="rounded px-2 py-1 text-xl hover:bg-blue-800">
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="mt-4 space-y-4 text-center text-sm text-slate-400">
                <p>
                  👋 Bonjour ! Je connais tout le catalogue et les avis de la communauté.
                  <br />
                  Que puis-je pour vous ?
                </p>
                <div className="flex flex-col items-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s.replace(/^\S+\s/, ""))}
                      className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-blue-500 hover:bg-slate-900"
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
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user" ? "rounded-br-none bg-blue-600 text-white" : "rounded-bl-none bg-slate-800 text-slate-100"
                  }`}
                >
                  {msg.role === "assistant" ? renderInline(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {waitingFirstWord && (
              <div className="flex items-center gap-1 text-sm text-slate-400">
                CineBot réfléchit
                <span className="animate-bounce">.</span>
                <span className="animate-bounce [animation-delay:150ms]">.</span>
                <span className="animate-bounce [animation-delay:300ms]">.</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-slate-800 p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={2000}
              placeholder={currentMovieId ? "Une question sur ce film ?" : "Demandez un film, un avis…"}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Envoyer
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={open}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-2xl shadow-lg shadow-black/40 transition-transform hover:scale-110"
          aria-label="Ouvrir CineBot"
        >
          💬
        </button>
      )}
    </div>
  );
}
