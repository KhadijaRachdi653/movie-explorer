"use client";

import Link from "next/link";
import { formatPrice } from "@/modules/subscriptions/subscription.constants";
import SubscriptionFilters from "./SubscriptionFilters";
import { PeriodBadge, StatusBadge, formatDate } from "./ui";
import { Pagination, useSubscriptionList } from "./useSubscriptionList";

// Historique des abonnements de l'utilisateur connecté, avec recherche et filtres
export default function SubscriptionHistory({ reloadKey }: { reloadKey: unknown }) {
  const { filters, setFilters, page, setPage, data, loading, error } = useSubscriptionList("mine", 8, reloadKey);

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold tracking-[-0.03em]">Historique</h2>
        {data && <span className="text-sm text-slate-400">{data.total} abonnement{data.total > 1 ? "s" : ""}</span>}
      </div>
      <SubscriptionFilters value={filters} onChange={setFilters} searchPlaceholder="Rechercher une offre…" />

      <div className={`mt-4 space-y-2 transition-opacity ${loading ? "opacity-60" : ""}`}>
        {error && <p className="text-sm text-red-400">{error}</p>}
        {data && data.subscriptions.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
            Aucun abonnement ne correspond à ces critères.
          </p>
        )}
        {data?.subscriptions.map((s) => (
          <Link
            key={s.id}
            href={`/subscriptions/${s.id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700 hover:bg-slate-900/70"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{s.planName}</span>
                <StatusBadge status={s.status} />
                <PeriodBadge period={s.billingPeriod} />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {formatDate(s.startDate)} → {formatDate(s.endDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{formatPrice(s.price)}</span>
              <span className="text-slate-500">›</span>
            </div>
          </Link>
        ))}
      </div>
      {data && <Pagination page={page} totalPages={data.totalPages} onPage={setPage} />}
    </section>
  );
}
