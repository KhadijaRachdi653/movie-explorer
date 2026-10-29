"use client";

import { useState, useTransition } from "react";
import { deleteReview, reportReview } from "@/actions/reviewActions";

export default function ReviewActions({
  movieId,
  reviewId,
  isOwner,
}: {
  movieId: number;
  reviewId: string;
  isOwner: boolean;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onDelete = () => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    start(async () => {
      const res = await deleteReview(movieId);
      setMsg(res.error ?? res.success ?? null);
    });
  };

  const onReport = () => {
    const reason = prompt("Raison du signalement :");
    if (!reason) return;
    start(async () => {
      const res = await reportReview(reviewId, reason);
      setMsg(res.error ?? res.success ?? null);
    });
  };

  return (
    <div className="mt-2 flex items-center gap-3 text-sm">
      {isOwner ? (
        <button type="button" onClick={onDelete} disabled={pending} className="text-red-500 underline">
          Supprimer mon commentaire
        </button>
      ) : (
        <button type="button" onClick={onReport} disabled={pending} className="underline">
          Signaler
        </button>
      )}
      {msg && <span>{msg}</span>}
    </div>
  );
}
