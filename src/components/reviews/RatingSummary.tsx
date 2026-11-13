import type { RatingSummary as Summary } from "@/modules/reviews/review.service";
import { StarDisplay } from "./Stars";

// Moyenne, nombre de votants et répartition des notes 5★ → 1★
export default function RatingSummary({ summary }: { summary: Summary }) {
  const max = Math.max(1, ...summary.distribution);
  return (
    <div className="grid gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="text-center sm:pr-6 sm:border-r sm:border-slate-800">
        <p className="text-5xl font-bold">{summary.count ? summary.average.toFixed(1) : "–"}</p>
        <StarDisplay value={summary.average} size="md" />
        <p className="mt-1 text-sm text-slate-400">
          {summary.count} vote{summary.count > 1 ? "s" : ""}
        </p>
      </div>
      <ul className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = summary.distribution[star - 1];
          return (
            <li key={star} className="flex items-center gap-3 text-sm">
              <span className="w-8 text-slate-400">{star} ★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                <span
                  className="block h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${(n / max) * 100}%` }}
                />
              </span>
              <span className="w-6 text-right text-slate-400">{n}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
