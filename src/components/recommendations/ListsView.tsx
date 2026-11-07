"use client";

import { useState } from "react";
import Link from "next/link";
import ListCover from "./ListCover";
import ListFormDialog from "./ListFormDialog";
import SignInPrompt from "./SignInPrompt";
import { useStreaming } from "./context";
import { btnPrimary } from "./ui";

export default function ListsView() {
  const { session, lists, listsLoaded, listsError, reloadLists } = useStreaming();
  const [creating, setCreating] = useState(false);

  if (session.status === "guest") {
    return <div className="pt-16"><SignInPrompt title="Vos listes de films" text="Connectez-vous pour créer des listes, y ranger vos films et recevoir des suggestions adaptées." /></div>;
  }

  return (
    <div className="px-4 pb-20 pt-28 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Mes listes</h1>
          {listsLoaded && lists.length > 0 && (
            <p className="mt-2 text-[var(--mist)]">{lists.length} liste{lists.length > 1 ? "s" : ""} sur 20</p>
          )}
        </div>
      </div>

      {listsError && lists.length > 0 && (
        <p role="alert" className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--edge)] bg-[var(--deep)] px-4 py-3 text-sm">
          <span>{listsError} Les listes affichées ne sont peut-être pas à jour.</span>
          <button type="button" className="font-semibold text-[var(--marquee)] underline-offset-4 hover:underline" onClick={() => void reloadLists()}>Réessayer</button>
        </p>
      )}

      {!listsLoaded ? (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" aria-hidden>
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i}><div className="skeleton aspect-[16/10] rounded-lg" /><div className="skeleton mt-3 h-4 w-1/2 rounded" /></li>
          ))}
        </ul>
      ) : listsError && lists.length === 0 ? (
        <div role="alert" className="mt-16 max-w-xl">
          <h2 className="text-2xl font-bold">Vos listes n’ont pas pu être chargées</h2>
          <p className="mt-2 text-[var(--mist)]">{listsError}</p>
          <button type="button" className={`${btnPrimary} mt-6`} onClick={() => void reloadLists()}>Réessayer</button>
        </div>
      ) : lists.length === 0 ? (
        <div className="mt-16 max-w-xl">
          <h2 className="text-2xl font-bold">Créez votre première liste</h2>
          <p className="mt-2 text-[var(--mist)]">
            Une liste pour les soirées en famille, une autre pour vos classiques préférés… Rangez vos films comme vous le souhaitez,
            et chaque liste aura ses propres suggestions.
          </p>
          <button type="button" className={`${btnPrimary} mt-6`} onClick={() => setCreating(true)}>Créer une liste</button>
        </div>
      ) : (
        <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {lists.length < 20 && (
            <li>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="group flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--edge)] text-[var(--mist)] transition-colors hover:border-[var(--marquee)] hover:text-[var(--ink)]"
              >
                <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-white/5 text-2xl transition-colors group-hover:bg-[var(--marquee)] group-hover:text-[#1a1203]">+</span>
                <span className="font-semibold">Nouvelle liste</span>
              </button>
            </li>
          )}
          {lists.map((l) => (
            <li key={l.id}>
              <Link href={`/lists/${l.id}`} className="group block">
                <div className="overflow-hidden rounded-lg ring-1 ring-white/5 transition duration-300 group-hover:-translate-y-1 group-hover:ring-[var(--marquee)]/70 [&_img:nth-child(4)]:group-hover:-translate-x-[125%] [&_img:nth-child(5)]:group-hover:translate-x-[25%]">
                  <ListCover list={l} />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold group-hover:text-[var(--marquee)]">{l.name}</h2>
                    <p className="text-sm text-[var(--mist)]">
                      {l.moviesCount === 0 ? "Aucun film" : `${l.moviesCount} film${l.moviesCount > 1 ? "s" : ""}`}
                    </p>
                    {l.description && <p className="mt-0.5 line-clamp-1 text-sm text-[var(--ink)]/70">{l.description}</p>}
                  </div>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${l.visibility === "public" ? "bg-[var(--marquee)]/15 text-[var(--marquee)]" : "bg-white/10 text-[var(--mist)]"}`}>
                    {l.visibility === "public" ? "Publique" : "Privée"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ListFormDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
