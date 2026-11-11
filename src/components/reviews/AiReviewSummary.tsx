"use client";

import { useState } from "react";
import { summarizeReviews } from "@/actions/aiActions";

// ✨ Synthèse IA des avis d'un film, générée à la demande
export default function AiReviewSummary({ movieId }: { movieId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    const res = await summarizeReviews(movieId);
    setLoading(false);
    if (res.error) return setError(res.error);
    setText(res.text ?? null);
  }

  if (text) {
    return (
      <div className="rounded-2xl border border-purple-500/40 bg-purple-500/10 p-4">
        <p className="mb-2 text-sm font-semibold text-purple-300">✨ Ce qu&apos;en pensent les spectateurs</p>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{text}</p>
        <p className="mt-2 text-xs text-slate-500">Résumé généré par IA (Gemini) à partir des avis publiés.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={generate}
        disabled={loading}
        className="rounded-lg border border-purple-500/50 px-3 py-1.5 text-sm text-purple-300 transition hover:bg-purple-500/10 disabled:opacity-50"
      >
        {loading ? "Analyse des avis…" : "✨ Résumer les avis avec l'IA"}
      </button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
}
