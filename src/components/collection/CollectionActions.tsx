"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COLLECTION_STATUSES, type CollectionMovieDto, type CollectionStatus } from "@/modules/collection/collection.types";

const STATUS_LABEL: Record<CollectionStatus, string> = { planned: "À voir", watching: "En cours", watched: "Vu" };

type Movie = { id: string; title: string; overview: string; posterUrl: string; year: number; rating: number; genres: string[] };

async function callApi<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Erreur ${res.status}`), { status: res.status });
  return data as T;
}

/**
 * Boutons « Favori » et « Suivi » de la fiche d'un film.
 * Utilisent l'API de la collection personnelle (Module 4) : /api/collection.
 */
export default function CollectionActions({ movie }: { movie: Movie }) {
  const [item, setItem] = useState<CollectionMovieDto | null>(null);
  const [state, setState] = useState<"loading" | "guest" | "ready">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    callApi<{ items: CollectionMovieDto[] }>("/api/collection")
      .then((data) => {
        if (cancelled) return;
        setItem(data.items.find((i) => i.movieId === movie.id) ?? null);
        setState("ready");
      })
      .catch((err: Error & { status?: number }) => { if (!cancelled) setState(err.status === 401 ? "guest" : "ready"); });
    return () => { cancelled = true; };
  }, [movie.id]);

  // Données du film envoyées à la collection (format du catalogue)
  const moviePayload = {
    movieId: movie.id,
    title: movie.title,
    overview: movie.overview.slice(0, 5000),
    posterUrl: movie.posterUrl || null,
    year: movie.year,
    rating: movie.rating,
    genres: movie.genres.slice(0, 20),
  };

  async function save(changes: { favorite?: boolean; status?: CollectionStatus }) {
    setBusy(true);
    setError("");
    try {
      const updated = item
        ? await callApi<CollectionMovieDto>(`/api/collection/${item.id}`, "PATCH", changes)
        : await callApi<CollectionMovieDto>("/api/collection", "POST", { movie: moviePayload, status: changes.status ?? "planned", favorite: changes.favorite ?? false });
      setItem(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeItem() {
    if (!item) return;
    setBusy(true);
    setError("");
    try {
      await callApi(`/api/collection/${item.id}`, "DELETE");
      setItem(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return <div className="skeleton h-11 w-72 rounded-md" aria-hidden />;
  if (state === "guest") {
    return (
      <p className="text-sm text-[var(--mist)]">
        <Link href="/login" className="font-semibold text-[var(--marquee)] hover:underline">Connectez-vous</Link> pour ajouter ce film à vos favoris ou à votre suivi.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ma collection">
        <button
          type="button"
          aria-pressed={item?.favorite ?? false}
          disabled={busy}
          onClick={() => void save({ favorite: !(item?.favorite ?? false) })}
          className={`rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
            item?.favorite ? "bg-[var(--marquee)] text-[#1a1203] hover:bg-[#f7c766]" : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {item?.favorite ? "♥ Dans mes favoris" : "♡ Ajouter aux favoris"}
        </button>
        <div className="inline-flex rounded-md border border-[var(--edge)] p-1" role="radiogroup" aria-label="Suivi du film">
          {COLLECTION_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={item?.status === s}
              disabled={busy}
              onClick={() => void save({ status: s })}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                item?.status === s ? "bg-[var(--ink)] text-[var(--night)]" : "text-[var(--mist)] hover:text-[var(--ink)]"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {item && (
          <button type="button" disabled={busy} onClick={() => void removeItem()} className="px-2 py-2 text-sm text-[var(--mist)] hover:text-red-300 disabled:opacity-60">
            Retirer de ma collection
          </button>
        )}
      </div>
      {item && (
        <p className="text-xs text-[var(--mist)]">
          Dans <Link href="/collection" className="text-[var(--marquee)] hover:underline">ma collection</Link>
          {item.viewingCount > 0 && ` · vu ${item.viewingCount} fois`}
        </p>
      )}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
