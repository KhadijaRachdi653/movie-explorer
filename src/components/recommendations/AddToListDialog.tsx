"use client";

import { useState } from "react";
import Link from "next/link";
import Dialog from "./Dialog";
import { useStreaming } from "./context";
import type { CardMovie } from "./movie";
import { btnPrimary, btnQuiet, field } from "./ui";

// « Ajouter à une liste » : cocher / décocher chaque liste, ou en créer une nouvelle
export default function AddToListDialog({ movie, onClose }: { movie: CardMovie | null; onClose: () => void }) {
  const { session, lists, addMovie, removeMovie, createList } = useStreaming();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  async function toggle(listId: string, inList: boolean) {
    if (!movie) return;
    setBusyId(listId);
    if (inList) await removeMovie(listId, movie);
    else await addMovie(listId, movie);
    setBusyId(null);
  }

  async function createAndAdd() {
    if (!movie || newName.trim().length < 2) return;
    setBusyId("new");
    const list = await createList({ name: newName.trim(), description: "", visibility: "private" });
    if (list) {
      await addMovie(list.id, movie);
      setNewName("");
    }
    setBusyId(null);
  }

  return (
    <Dialog open={movie !== null} onClose={onClose} labelledBy="add-to-list-title">
      <div className="p-5">
        <h2 id="add-to-list-title" className="text-lg font-bold">Ajouter à une liste</h2>
        <p className="mt-1 text-sm text-[var(--mist)]">{movie?.title}</p>

        {session.status !== "user" ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm">Connectez-vous pour ranger vos films dans vos listes.</p>
            <Link href="/login" className={btnPrimary}>Se connecter</Link>
          </div>
        ) : (
          <>
            <ul className="mt-4 space-y-1">
              {lists.length === 0 && <li className="text-sm text-[var(--mist)]">Vous n’avez pas encore de liste. Créez-en une ci-dessous.</li>}
              {lists.map((l) => {
                const inList = movie ? l.movieIds.includes(movie.movieId) : false;
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => void toggle(l.id, inList)}
                      disabled={busyId !== null}
                      aria-pressed={inList}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-white/5 disabled:opacity-60"
                    >
                      <span
                        aria-hidden
                        className={`flex size-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
                          inList ? "border-[var(--marquee)] bg-[var(--marquee)] text-[#1a1203]" : "border-[var(--edge)]"
                        }`}
                      >
                        {inList ? "✓" : ""}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium">{l.name}</span>
                      <span className="text-xs text-[var(--mist)]">{l.moviesCount} film{l.moviesCount > 1 ? "s" : ""}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <form
              className="mt-4 flex gap-2 border-t border-[var(--edge)] pt-4"
              onSubmit={(e) => { e.preventDefault(); void createAndAdd(); }}
            >
              <label htmlFor="new-list-name" className="sr-only">Nom de la nouvelle liste</label>
              <input
                id="new-list-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nouvelle liste"
                maxLength={50}
                className={field}
              />
              <button className={btnPrimary} disabled={newName.trim().length < 2 || busyId !== null}>Créer</button>
            </form>
          </>
        )}

        <div className="mt-5 flex justify-end">
          <button type="button" className={btnQuiet} onClick={onClose}>Terminé</button>
        </div>
      </div>
    </Dialog>
  );
}
