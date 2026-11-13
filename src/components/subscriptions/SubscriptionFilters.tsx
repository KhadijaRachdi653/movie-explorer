"use client";

import { PLANS, STATUS_LABELS, SUBSCRIPTION_STATUSES } from "@/modules/subscriptions/subscription.constants";
import { inputClass } from "./ui";

export interface FilterState {
  q: string;
  status: string;
  billingPeriod: string;
  planName: string;
  sort: string;
}

export const emptyFilters: FilterState = { q: "", status: "", billingPeriod: "", planName: "", sort: "recent" };

export function filtersToQuery(f: FilterState, extra: Record<string, string | number>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...f, ...extra })) if (v !== "" && v !== undefined) params.set(k, String(v));
  return params.toString();
}

// Barre de recherche et filtres, partagée par l'historique utilisateur et l'écran administrateur
export default function SubscriptionFilters({
  value,
  onChange,
  searchPlaceholder,
  planNames = PLANS.map((p) => p.name),
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  searchPlaceholder: string;
  planNames?: string[];
}) {
  const set = (k: keyof FilterState) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
  const select = `${inputClass} sm:w-auto`;
  const active = value.q || value.status || value.billingPeriod || value.planName || value.sort !== "recent";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <input
        type="search"
        value={value.q}
        onChange={set("q")}
        placeholder={searchPlaceholder}
        aria-label="Rechercher"
        className={`${inputClass} sm:min-w-56 sm:flex-1`}
      />
      <select value={value.status} onChange={set("status")} aria-label="Statut" className={select}>
        <option value="">Tous les statuts</option>
        {SUBSCRIPTION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <select value={value.planName} onChange={set("planName")} aria-label="Offre" className={select}>
        <option value="">Toutes les offres</option>
        {planNames.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select value={value.billingPeriod} onChange={set("billingPeriod")} aria-label="Période" className={select}>
        <option value="">Mensuel et annuel</option>
        <option value="monthly">Mensuel</option>
        <option value="yearly">Annuel</option>
      </select>
      <select value={value.sort} onChange={set("sort")} aria-label="Tri" className={select}>
        <option value="recent">Plus récents</option>
        <option value="oldest">Plus anciens</option>
        <option value="price-desc">Prix décroissant</option>
        <option value="price-asc">Prix croissant</option>
        <option value="end-soon">Fin la plus proche</option>
      </select>
      {active && (
        <button onClick={() => onChange(emptyFilters)} className="text-sm text-slate-400 hover:text-white">
          Réinitialiser
        </button>
      )}
    </div>
  );
}
