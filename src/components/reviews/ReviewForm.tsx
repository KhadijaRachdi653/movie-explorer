"use client";

import { useActionState, useState } from "react";
import { saveReview, type ReviewActionState } from "@/actions/reviewActions";

const MAX = 1000;

export default function ReviewForm({
  movieId,
  initialContent = "",
}: {
  movieId: number;
  initialContent?: string;
}) {
  const [state, action, pending] = useActionState<ReviewActionState, FormData>(saveReview, {});
  const [text, setText] = useState(initialContent);
  const isEditing = initialContent.length > 0;

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="movieId" value={movieId} />
      <label htmlFor="review-content" className="block text-sm font-medium text-slate-200">
        {isEditing ? "Modifier votre commentaire" : "Écrire un commentaire"}
      </label>
      <textarea
        id="review-content"
        name="content"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX}
        rows={4}
        placeholder="Qu'avez-vous pensé de ce film ?"
        className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 p-3 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs tabular-nums text-slate-500">
          {text.length} / {MAX}
        </span>
        <button
          disabled={pending || text.trim().length < 3}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {pending ? "Enregistrement..." : isEditing ? "Enregistrer les modifications" : "Publier"}
        </button>
      </div>
      <div aria-live="polite">
        {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state.success && <p className="text-sm text-emerald-400">{state.success}</p>}
      </div>
    </form>
  );
}