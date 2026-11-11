"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReviewDto } from "@/modules/reviews/review.service";
import { StarDisplay } from "./Stars";
import { reviewsApi, timeAgo } from "./api";

const LONG_REVIEW = 280;

function Avatar({ name, avatar }: { name: string; avatar: string }) {
  if (/^(https?:\/\/|\/)/.test(avatar)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold uppercase">
      {name.charAt(0)}
    </span>
  );
}

export default function ReviewCard({
  review,
  isLoggedIn,
  isAdmin = false,
  highlight = false,
}: {
  review: ReviewDto;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  highlight?: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(review.likedByMe);
  const [likes, setLikes] = useState(review.likeCount);
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "report">("view");
  const [content, setContent] = useState(review.content);
  const [spoiler, setSpoiler] = useState(review.spoiler);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(call: () => Promise<{ error?: string; data?: unknown }>, onSuccess?: (data: unknown) => void) {
    setBusy(true);
    setMessage(null);
    const { error, data } = await call();
    setBusy(false);
    if (error) return setMessage({ ok: false, text: error });
    onSuccess?.(data);
  }

  const toggleLike = () =>
    run(
      () => reviewsApi(`/api/reviews/${review.id}/like`, "POST"),
      (data) => {
        const res = data as { liked: boolean; likeCount: number };
        setLiked(res.liked);
        setLikes(res.likeCount);
      }
    );

  const save = () =>
    run(
      () => reviewsApi(`/api/reviews/${review.id}`, "PATCH", { content, spoiler }),
      () => {
        setMode("view");
        router.refresh();
      }
    );

  const remove = () => {
    if (!confirm("Supprimer définitivement cet avis ?")) return;
    run(() => reviewsApi(`/api/reviews/${review.id}`, "DELETE"), () => router.refresh());
  };

  const report = () =>
    run(
      () => reviewsApi(`/api/reviews/${review.id}/report`, "POST", { reason }),
      () => {
        setMode("view");
        setMessage({ ok: true, text: "Merci, l'avis a été signalé à la modération." });
      }
    );

  const hidden = review.spoiler && !showSpoiler && !review.isMine;
  const long = review.content.length > LONG_REVIEW && !expanded;

  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        highlight ? "border-amber-400/50 bg-gradient-to-br from-amber-400/10 to-slate-900" : "border-slate-800 bg-slate-900"
      }`}
    >
      <header className="flex items-start gap-3">
        <Avatar name={review.author.name} avatar={review.author.avatar} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {review.author.name}
            {review.isMine && <span className="ml-2 rounded-full bg-blue-600/20 px-2 py-0.5 text-xs text-blue-300">Vous</span>}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
            {review.score !== null && <StarDisplay value={review.score} />}
            <span>{timeAgo(review.createdAt)}</span>
            {review.edited && <span>· modifié</span>}
          </p>
        </div>
        {highlight && <span className="shrink-0 text-xs font-medium text-amber-300">🏆 Le plus apprécié</span>}
      </header>

      {mode === "edit" ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            rows={4}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <label className="flex items-center gap-2 text-slate-300">
              <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} />
              Contient des spoilers
            </label>
            <div className="flex gap-2">
              <button onClick={() => setMode("view")} className="rounded-lg px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                Annuler
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      ) : hidden ? (
        <button
          onClick={() => setShowSpoiler(true)}
          className="mt-3 w-full rounded-xl border border-dashed border-slate-700 px-3 py-4 text-sm text-slate-400 hover:border-amber-400 hover:text-amber-300"
        >
          ⚠️ Cet avis contient des spoilers — cliquer pour l&apos;afficher
        </button>
      ) : (
        <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-200">
          {long ? `${review.content.slice(0, LONG_REVIEW)}… ` : review.content}
          {long && (
            <button onClick={() => setExpanded(true)} className="text-sm text-blue-400 hover:underline">
              Lire la suite
            </button>
          )}
        </p>
      )}

      {mode === "report" && (
        <div className="mt-3 flex gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            placeholder="Pourquoi cet avis est-il inapproprié ?"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={report}
            disabled={busy}
            className="rounded-lg bg-red-600/80 px-3 py-1.5 text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Signaler
          </button>
          <button onClick={() => setMode("view")} className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">
            Annuler
          </button>
        </div>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-1 text-sm">
        <button
          onClick={toggleLike}
          disabled={busy || !isLoggedIn || review.isMine}
          title={review.isMine ? "C'est votre avis" : isLoggedIn ? "J'aime cet avis" : "Connectez-vous pour aimer"}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition disabled:cursor-not-allowed ${
            liked ? "bg-blue-600/20 text-blue-300" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          👍 <span>{likes}</span>
        </button>
        {review.isMine && mode === "view" && (
          <button onClick={() => setMode("edit")} className="rounded-lg px-2.5 py-1 text-slate-400 hover:bg-slate-800 hover:text-white">
            ✏️ Modifier
          </button>
        )}
        {(review.isMine || isAdmin) && (
          <button onClick={remove} disabled={busy} className="rounded-lg px-2.5 py-1 text-slate-400 hover:bg-slate-800 hover:text-red-400">
            🗑️ Supprimer
          </button>
        )}
        {isLoggedIn && !review.isMine && mode === "view" && (
          <button
            onClick={() => setMode("report")}
            className="ml-auto rounded-lg px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            🚩 Signaler
          </button>
        )}
      </footer>
      {message && <p className={`mt-2 text-sm ${message.ok ? "text-green-400" : "text-red-400"}`}>{message.text}</p>}
    </article>
  );
}
