"use client";

import { useActionState } from "react";
import { saveReview, type ReviewActionState } from "@/actions/reviewActions";

export default function ReviewForm({ movieId, initialContent = "" }: { movieId: number; initialContent?: string }) {
  const [state, action, pending] = useActionState<ReviewActionState, FormData>(saveReview, {});

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="movieId" value={movieId} />
      <textarea
        name="content"
        defaultValue={initialContent}
        maxLength={1000}
        rows={4}
        placeholder="Votre avis sur ce film..."
        className="rounded border p-2"
      />
      <button disabled={pending} className="self-start rounded bg-blue-600 px-4 py-2 text-white">
        {pending ? "Envoi..." : initialContent ? "Modifier mon commentaire" : "Publier"}
      </button>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.success && <p className="text-sm text-green-500">{state.success}</p>}
    </form>
  );
}