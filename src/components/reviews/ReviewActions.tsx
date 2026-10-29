"use client";

import { useState, useTransition } from "react";
import { deleteReview, reportReview } from "@/actions/reviewActions";

const REASONS = ["Contenu offensant", "Spam ou publicité", "Spoiler non signalé", "Autre"];

export default function ReviewActions({
  movieId,
  reviewId,
  isOwner,
}: {
  movieId: number;
  reviewId: string;
  isOwner: boolean;
}) {
  const [mode, setMode] = useState<"idle" | "confirm" | "report">("idle");
  const [reason, setReason] = useState(REASONS[0]);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();

  function onDelete() {
    start(async () => {
      const res = await deleteReview(movieId);
      if (res.error) setMsg({ type: "error", text: res.error });
      setMode("idle");
    });
  }

  function onReport() {
    start(async () => {
      const res = await reportReview(reviewId, reason);
      setMsg(res.error ? { type: "error", text: res.error } : { type: "ok", text: res.success ?? "Signalé." });
      setMode("idle");
    });
  }

  const link = "text-slate-400 underline underline-offset-2 hover:text-slate-200";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-3 text-sm">
      {mode === "idle" &&
        (isOwner ? (
          <button type="button" onClick={() => setMode("confirm")} className="text-red-400 underline underline-offset-2 hover:text-red-300">
            Supprimer
          </button>
        ) : (
          <button type="button" onClick={() => setMode("report")} className={link}>
            Signaler
          </button>
        ))}

      {mode === "confirm" && (
        <>
          <span className="text-slate-300">Supprimer définitivement ce commentaire ?</span>
          <button type="button" onClick={onDelete} disabled={pending} className="rounded-md bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-700 disabled:opacity-60">
            {pending ? "Suppression..." : "Supprimer"}
          </button>
          <button type="button" onClick={() => setMode("idle")} className={link}>
            Annuler
          </button>
        </>
      )}

      {mode === "report" && (
        <>
          <label htmlFor={`reason-${reviewId}`} className="text-slate-300">
            Motif :
          </label>
          <select
            id={`reason-${reviewId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100 focus:border-blue-500 focus:outline-none"
          >
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <button type="button" onClick={onReport} disabled={pending} className="rounded-md bg-blue-600 px-3 py-1 font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {pending ? "Envoi..." : "Signaler"}
          </button>
          <button type="button" onClick={() => setMode("idle")} className={link}>
            Annuler
          </button>
        </>
      )}

      {msg && (
        <span aria-live="polite" className={msg.type === "ok" ? "text-emerald-400" : "text-red-400"}>
          {msg.text}
        </span>
      )}
    </div>
  );
}