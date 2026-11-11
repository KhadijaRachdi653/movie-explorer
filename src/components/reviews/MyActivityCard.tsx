"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MyActivityItem } from "@/modules/reviews/review.service";
import { StarPicker } from "./Stars";
import { reviewsApi, timeAgo } from "./api";

// Une ligne de /profile/ratings : modifier ou retirer sa note, modifier ou supprimer son avis
export default function MyActivityCard({ item }: { item: MyActivityItem }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(item.review?.content ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const title = item.movie?.title ?? "Film retiré du catalogue";

  async function run(url: string, method: string, body?: unknown, after?: () => void) {
    setBusy(true);
    setError(null);
    const { error } = await reviewsApi(url, method, body);
    setBusy(false);
    if (error) return setError(error);
    after?.();
    router.refresh();
  }

  return (
    <article className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      {item.movie?.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.movie.posterUrl} alt={title} className="h-28 w-20 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-2xl">🎬</div>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {item.movie ? (
            <Link href={`/movies/${item.movie.id}`} className="font-semibold hover:text-blue-400">
              {title} <span className="text-sm font-normal text-slate-400">({item.movie.year})</span>
            </Link>
          ) : (
            <span className="font-semibold text-slate-400">{title}</span>
          )}
          <span className="text-xs text-slate-500">{timeAgo(item.updatedAt)}</span>
        </div>

        {item.movie && (
          <div className="flex flex-wrap items-center gap-3">
            <StarPicker
              value={item.score}
              disabled={busy}
              onChange={(score) => run("/api/ratings", "PUT", { movieId: item.movieId, score })}
            />
            {item.score !== null && (
              <button
                onClick={() => run(`/api/ratings?movieId=${item.movieId}`, "DELETE")}
                disabled={busy}
                className="text-xs text-slate-500 hover:text-red-400"
              >
                Retirer ma note
              </button>
            )}
          </div>
        )}

        {item.review &&
          (editing ? (
            <div className="space-y-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-2 text-sm">
                <button onClick={() => setEditing(false)} className="rounded-lg px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Annuler
                </button>
                <button
                  onClick={() => run(`/api/reviews/${item.review!.id}`, "PATCH", { content }, () => setEditing(false))}
                  disabled={busy}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="line-clamp-3 text-sm text-slate-300">
                {item.review.spoiler && <span className="mr-1 text-amber-300">⚠️ Spoiler</span>}
                {item.review.content}
              </p>
              <div className="mt-1 flex items-center gap-1 text-sm">
                <span className="mr-2 text-slate-400">👍 {item.review.likeCount}</span>
                <button onClick={() => setEditing(true)} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white">
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => confirm("Supprimer définitivement cet avis ?") && run(`/api/reviews/${item.review!.id}`, "DELETE")}
                  disabled={busy}
                  className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        {!item.review && item.movie && (
          <Link href={`/movies/${item.movie.id}#avis`} className="text-sm text-blue-400 hover:underline">
            + Écrire un avis
          </Link>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </article>
  );
}
