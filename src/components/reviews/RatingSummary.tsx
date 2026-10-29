import StarDisplay from "./StarDisplay";
import type { Distribution, Star } from "@/lib/reviews";

export default function RatingSummary({
  average,
  count,
  distribution,
}: {
  average: number;
  count: number;
  distribution: Distribution;
}) {
  return (
    <div>
      <div className="flex items-end gap-4">
        <p className="text-5xl font-semibold leading-none tabular-nums">
          {count ? average.toFixed(1) : "–"}
        </p>
        <div className="pb-0.5">
          <StarDisplay value={average} size={18} />
          <p className="mt-1 text-sm text-slate-400">
            {count === 0 ? "Pas encore de note" : `${count} note${count > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-1.5" aria-label="Répartition des notes">
        {([5, 4, 3, 2, 1] as Star[]).map((n) => {
          const v = distribution[n];
          const pct = count ? Math.round((v / count) * 100) : 0;
          return (
            <li key={n} className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-3 tabular-nums">{n}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                <span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-6 text-right tabular-nums">{v}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}