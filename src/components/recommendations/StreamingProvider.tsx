"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CustomListDTO } from "@/modules/recommendations/types";
import { StreamingContext, type Session, type StreamingContextValue, type Toast, type ToastAction } from "./context";
import AddToListDialog from "./AddToListDialog";
import MovieQuickView from "./MovieQuickView";
import { apiFetch, ApiClientError } from "./api";
import { toListMovieInput, type CardMovie } from "./movie";

export default function StreamingProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ status: "loading", userId: null, name: null });
  const [lists, setLists] = useState<CustomListDTO[]>([]);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [listsError, setListsError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const [addTarget, setAddTarget] = useState<CardMovie | null>(null);
  const [quickView, setQuickView] = useState<{ movie: CardMovie; listId?: string } | null>(null);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback((message: string, tone: Toast["tone"] = "success", action?: ToastAction) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone, action }]);
    setTimeout(() => dismiss(id), action ? 7000 : 4000); // plus de temps pour pouvoir annuler
  }, [dismiss]);

  const fail = useCallback((err: unknown) => {
    notify(err instanceof ApiClientError ? err.message : "Une erreur est survenue. Réessayez.", "error");
  }, [notify]);

  const reloadLists = useCallback(async () => {
    try {
      const data = await apiFetch<{ lists: CustomListDTO[] }>("/api/lists");
      setLists(data.lists);
      setListsError(null);
    } catch (err) {
      // On garde les listes déjà affichées : une coupure réseau ne doit pas les faire disparaître
      setListsError(err instanceof ApiClientError ? err.message : "Vos listes n’ont pas pu être chargées.");
    } finally {
      setListsLoaded(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<{ user?: { id?: string; name?: string } } | null>("/api/auth/session");
        if (cancelled) return;
        const user = data?.user;
        setSession(user?.id ? { status: "user", userId: user.id, name: user.name ?? null } : { status: "guest", userId: null, name: null });
        if (user?.id) await reloadLists();
        else setListsLoaded(true);
      } catch {
        if (!cancelled) {
          setSession({ status: "guest", userId: null, name: null });
          setListsLoaded(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [reloadLists]);

  const addMovie = useCallback(async (listId: string, movie: CardMovie) => {
    try {
      const list = await apiFetch<CustomListDTO>(`/api/lists/${listId}/movies`, { method: "POST", body: toListMovieInput(movie) });
      await reloadLists();
      notify(`« ${movie.title} » ajouté à ${list.name}.`);
      return true;
    } catch (err) { fail(err); return false; }
  }, [reloadLists, notify, fail]);

  const value = useMemo<StreamingContextValue>(() => ({
    session,
    lists,
    listsLoaded,
    listsError,
    reloadLists,
    notify,
    openAddToList: (movie) => setAddTarget(movie),
    openMovie: (movie, listId) => setQuickView({ movie, listId }),
    async createList(input) {
      try {
        const list = await apiFetch<CustomListDTO>("/api/lists", { method: "POST", body: input });
        await reloadLists();
        notify(`Liste « ${list.name} » créée.`);
        return list;
      } catch (err) { fail(err); return null; }
    },
    async updateList(id, input) {
      try {
        const list = await apiFetch<CustomListDTO>(`/api/lists/${id}`, { method: "PATCH", body: input });
        await reloadLists();
        notify("Modifications enregistrées.");
        return list;
      } catch (err) { fail(err); return null; }
    },
    async deleteList(id) {
      try {
        await apiFetch(`/api/lists/${id}`, { method: "DELETE" });
        await reloadLists();
        notify("Liste supprimée.");
        return true;
      } catch (err) { fail(err); return false; }
    },
    addMovie,
    async removeMovie(listId, movie) {
      try {
        const list = await apiFetch<CustomListDTO>(`/api/lists/${listId}/movies/${movie.movieId}`, { method: "DELETE" });
        await reloadLists();
        notify(`« ${movie.title} » retiré de ${list.name}.`, "success", {
          label: "Annuler",
          run: () => void addMovie(listId, movie),
        });
        return true;
      } catch (err) { fail(err); return false; }
    },
  }), [session, lists, listsLoaded, listsError, reloadLists, notify, fail, addMovie]);

  return (
    <StreamingContext.Provider value={value}>
      {children}
      <AddToListDialog movie={addTarget} onClose={() => setAddTarget(null)} />
      <MovieQuickView movie={quickView?.movie ?? null} listId={quickView?.listId} onClose={() => setQuickView(null)} />
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex max-w-md items-center gap-4 rounded-lg border px-4 py-3 text-sm shadow-2xl ${
              t.tone === "success"
                ? "border-[var(--edge)] bg-[var(--raised)] text-[var(--ink)]"
                : "border-[var(--danger)]/40 bg-[#2a1416] text-[var(--danger)]"
            }`}
          >
            <p>{t.message}</p>
            {t.action && (
              <button
                type="button"
                className="shrink-0 font-semibold text-[var(--marquee)] underline-offset-4 hover:underline"
                onClick={() => { t.action!.run(); dismiss(t.id); }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </StreamingContext.Provider>
  );
}
