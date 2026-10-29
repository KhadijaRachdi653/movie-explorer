"use client";

import { useState, useTransition } from "react";
import { setRating, deleteRating } from "@/actions/reviewActions";

const LABELS = ["", "Mauvais", "Passable", "Bien", "Très bien", "Excellent"];

export default function RatingStars({
  movieId,
  initialScore,
}: {
  movieId: number;
  initialScore: number;
}) {
  const [score, setScore] = useState(initialScore);
  const [hover, setHover] = useState(0);
  const [status, setStatus] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const shown = hover || score;

  function choose(value: number) {
    const previous = score;
    setScore(value);
    setStatus(null);
    start(async () => {
      const res = await setRating(movieId, value);
      if (res.error) {
        setScore(previous);
        setStatus({ type: "error", text: res.error });
      } else {
        setStatus({ type: "ok", text: "Note enregistrée" });
      }
    });
  }

  function remove() {
    const previous = score;
    setScore(0);
    setStatus(null);
    start(async () => {
      const res = await deleteRating(movieId);
      if (res.error) {
        setScore(previous);
        setStatus({ type: "error", text: res.error });
      } else {
        setStatus({ type: "ok", text: "Note supprimée" });
      }
    });
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Votre note sur 5"
        className="flex gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={score === n}
            aria-label={`${n} sur 5, ${LABELS[n]}`}
            disabled={pending}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => choose(n)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-60"
          >
            <svg
              viewBox="0 0 24 24"
              width="34"
              height="34"
              fill="currentColor"
              aria-hidden="true"
              className={n <= shown ? "text-amber-400" : "text-slate-700"}
            >
              <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z" />
            </svg>
          </button>
        ))}
      </div>

      <p className="mt-2 text-sm text-slate-300" aria-live="polite">
        {shown ? LABELS[shown] : "Touchez une étoile pour noter"}
      </p>

      <div className="mt-1 flex min-h-5 items-center gap-3 text-sm">
        {status && (
          <span className={status.type === "ok" ? "text-emerald-400" : "text-red-400"}>{status.text}</span>
        )}
        {score > 0 && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-slate-400 underline underline-offset-2 hover:text-slate-200 disabled:opacity-60"
          >
            Retirer ma note
          </button>
        )}
      </div>
    </div>
  );
}