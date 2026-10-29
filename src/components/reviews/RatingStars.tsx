"use client";

import { useState, useTransition } from "react";
import { setRating, deleteRating } from "@/actions/reviewActions";

export default function RatingStars({ movieId, initialScore }: { movieId: number; initialScore: number }) {
  const [score, setScore] = useState(initialScore);
  const [hover, setHover] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const choose = (value: number) =>
    start(async () => {
      const res = await setRating(movieId, value);
      if (res.error) setMsg(res.error);
      else { setScore(value); setMsg(null); }
    });

  const remove = () =>
    start(async () => {
      const res = await deleteRating(movieId);
      if (res.error) setMsg(res.error);
      else { setScore(0); setMsg(null); }
    });

  return (
    <div>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={pending}
            aria-label={`Noter ${n} sur 5`}
            onMouseEnter={() => setHover(n)}
            onClick={() => choose(n)}
            className={`text-3xl ${n <= (hover || score) ? "text-yellow-400" : "text-gray-500"}`}
          >
            ★
          </button>
        ))}
        {score > 0 && (
          <button type="button" onClick={remove} disabled={pending} className="ml-3 text-sm underline">
            Supprimer ma note
          </button>
        )}
      </div>
      {msg && <p className="text-sm text-red-500">{msg}</p>}
    </div>
  );
}