"use client";

import { useEffect, useState } from "react";
import { reviewsApi } from "@/components/reviews/api";
import type { SubscriptionPage } from "@/modules/subscriptions/subscription.service";
import { emptyFilters, filtersToQuery, type FilterState } from "./SubscriptionFilters";

// Charge une page d'abonnements depuis GET /api/subscriptions selon les filtres (recherche texte temporisée)
export function useSubscriptionList(scope: "mine" | "all", limit: number, reloadKey: unknown) {
  const [filters, setFiltersState] = useState<FilterState>(emptyFilters);
  const [query, setQuery] = useState(emptyFilters.q);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SubscriptionPage | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { status, billingPeriod, planName, sort } = filters;
  const qs = filtersToQuery({ q: query, status, billingPeriod, planName, sort }, { scope, page, limit });
  const requestKey = `${qs}#${String(reloadKey)}`;
  const loading = loadedKey !== requestKey;

  // Toute modification de filtre ramène à la première page
  const setFilters = (next: FilterState) => {
    setFiltersState(next);
    setPage(1);
  };

  useEffect(() => {
    const t = setTimeout(() => setQuery(filters.q), 300);
    return () => clearTimeout(t);
  }, [filters.q]);

  useEffect(() => {
    // filters.q est pris en compte via `query` (temporisé) ; reloadKey change après chaque action côté serveur
    let cancelled = false;
    reviewsApi(`/api/subscriptions?${qs}`, "GET").then(({ data, error }) => {
      if (cancelled) return;
      setLoadedKey(requestKey);
      setError(error ?? null);
      if (data) setData(data as SubscriptionPage);
    });
    return () => {
      cancelled = true;
    };
  }, [qs, requestKey]);

  return { filters, setFilters, page, setPage, data, loading, error };
}

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-4 text-sm">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="text-blue-400 disabled:text-slate-600">
        ← Précédent
      </button>
      <span className="text-slate-400">
        Page {page} / {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="text-blue-400 disabled:text-slate-600">
        Suivant →
      </button>
    </div>
  );
}
