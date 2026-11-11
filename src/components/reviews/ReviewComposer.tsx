"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { generateReviewDraft } from "@/actions/aiActions";
import { StarPicker } from "./Stars";
import { reviewsApi } from "./api";

// Noter le film et publier son avis ; si l'avis existe déjà, il se modifie depuis sa carte
export default function ReviewComposer({
  movieId,
  myScore,
  hasReview,
  isLoggedIn,
}: {
  movieId: string;
  myScore: number | null;
  hasReview: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [score, setScore] = useState(myScore);
  const [content, setContent] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [busy, setBusy] = useState<"rating" | "review" | "ai" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-slate-300">Vous avez vu ce film ? Donnez votre note et partagez votre avis.</p>
        <Link href="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700">
          Se connecter pour donner son avis
        </Link>
      </div>
    );
  }

  async function rate(next: number | null) {
    setBusy("rating");
    setError(null);
    const { error } =
      next === null
        ? await reviewsApi(`/api/ratings?movieId=${movieId}`, "DELETE")
        : await reviewsApi("/api/ratings", "PUT", { movieId, score: next });
    setBusy(null);
    if (error) return setError(error);
    setScore(next);
    router.refresh();
  }

  async function publish() {
    setBusy("review");
    setError(null);
    const { error } = await reviewsApi("/api/reviews", "POST", { movieId, content, spoiler });
    setBusy(null);
    if (error) return setError(error);
    setContent("");
    setSpoiler(false);
    router.refresh();
  }

  async function draftWithAi() {
    setBusy("ai");
    setError(null);
    const res = await generateReviewDraft(movieId, score, content);
    setBusy(null);
    if (res.error) return setError(res.error);
    setContent(res.text ?? "");
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div>
        <p className="mb-1 text-sm font-medium text-slate-300">Votre note</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StarPicker value={score} onChange={rate} disabled={busy !== null} />
          {score !== null && (
            <button onClick={() => rate(null)} disabled={busy !== null} className="text-xs text-slate-500 hover:text-red-400">
              Retirer ma note
            </button>
          )}
        </div>
      </div>

      {hasReview ? (
        <p className="text-sm text-slate-400">✅ Vous avez publié un avis sur ce film. Modifiez-le ou supprimez-le depuis sa carte.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="review-content" className="text-sm font-medium text-slate-300">
              Votre avis
            </label>
            <button
              type="button"
              onClick={draftWithAi}
              disabled={busy !== null}
              title="Écrivez quelques mots-clés, l'IA les transforme en avis"
              className="rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {busy === "ai" ? "Rédaction…" : "✨ Aide-moi à rédiger"}
            </button>
          </div>
          <textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Qu'avez-vous pensé du film ? (ou quelques mots-clés pour l'IA : « visuels magnifiques, fin trop longue »)"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <label className="flex items-center gap-2 text-slate-300">
              <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} />
              Contient des spoilers
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{content.length}/1000</span>
              <button
                onClick={publish}
                disabled={busy !== null || content.trim().length < 3}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {busy === "review" ? "Publication…" : "Publier"}
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
