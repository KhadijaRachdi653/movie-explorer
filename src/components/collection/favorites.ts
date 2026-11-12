"use client";

import { useEffect, useState } from "react";

// Favoris de l'utilisateur (Module 4, /api/collection?favorite=true), partagés par toutes les cartes de la page.
// Un seul appel réseau pour toutes les affiches ; rechargé quand un favori change (événement "favorites-changed").
export const FAVORITES_CHANGED = "favorites-changed";

let pending: Promise<Set<string>> | null = null;

function loadFavorites(): Promise<Set<string>> {
  pending ??= fetch("/api/collection?favorite=true", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { items: [] }))
    .then((d: { items?: { movieId: string }[] }) => new Set((d.items ?? []).map((i) => i.movieId)))
    .catch(() => new Set<string>())
    .finally(() => setTimeout(() => { pending = null; }, 3000)); // évite de redemander pour chaque carte
  return pending;
}

export function notifyFavoritesChanged() {
  pending = null;
  window.dispatchEvent(new Event(FAVORITES_CHANGED));
}

export function useFavoriteIds(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    let alive = true;
    const refresh = () => loadFavorites().then((s) => { if (alive) setIds(s); });
    refresh();
    window.addEventListener(FAVORITES_CHANGED, refresh);
    return () => { alive = false; window.removeEventListener(FAVORITES_CHANGED, refresh); };
  }, []);
  return ids;
}
