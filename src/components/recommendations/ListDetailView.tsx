"use client";
/* eslint-disable @next/next/no-img-element -- images TMDB externes */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CustomListDTO } from "@/modules/recommendations/types";
import AddMoviesDialog from "./AddMoviesDialog";
import ConfirmDialog from "./ConfirmDialog";
import ListFormDialog from "./ListFormDialog";
import ListRecoRow from "./ListRecoRow";
import MovieCard from "./MovieCard";
import { useStreaming } from "./context";
import { fromListMovie, TMDB_POSTER } from "./movie";
import { useApiData } from "./useApiData";
import { btnDanger, btnPrimary, btnSecondary } from "./ui";

export default function ListDetailView({ id }: { id: string }) {
  const { lists, listsLoaded, session } = useStreaming();
  const own = lists.find((l) => l.id === id);
  // Liste d'un autre utilisateur (publique) : chargée à part, en lecture seule
  const other = useApiData<CustomListDTO>(listsLoaded && !own ? `/api/lists/${id}` : null);

  if (!listsLoaded || (!own && other.loading)) {
    return <div className="skeleton h-[50vh] min-h-[360px] w-full" aria-hidden />;
  }
  if (own) return <ListDetail list={own} isOwner />;
  if (other.data) return <ListDetail list={other.data} isOwner={false} />;

  const status = other.error?.status;
  const offline = status === 0;
  const message =
    offline
      ? "Pas de connexion. Vérifiez votre réseau puis réessayez."
      : status === 403
      ? session.status === "user"
        ? "Cette liste est privée. Seule la personne qui l’a créée peut la voir."
        : "Cette liste est privée. Si c’est la vôtre, connectez-vous pour la voir."
      : status === 404 || status === 400
        ? "Cette liste n’existe pas ou a été supprimée."
        : other.error?.message ?? "La liste n’a pas pu être chargée.";

  return (
    <div className="mx-auto max-w-lg px-4 pb-16 pt-32 text-center">
      <h1 className="text-2xl font-bold">{offline ? "Connexion impossible" : status === 403 ? "Liste privée" : "Liste introuvable"}</h1>
      <p className="mt-2 text-[var(--mist)]">{message}</p>
      <div className="mt-6 flex justify-center gap-2">
        {offline ? (
          <button type="button" className={btnPrimary} onClick={other.reload}>Réessayer</button>
        ) : (
          <Link href="/lists" className={btnPrimary}>Voir mes listes</Link>
        )}
        {status === 403 && session.status !== "user" && <Link href="/login" className={btnSecondary}>Se connecter</Link>}
      </div>
    </div>
  );
}

type SortKey = "recent" | "oldest" | "title";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Ajout récent" },
  { value: "oldest", label: "Ajout ancien" },
  { value: "title", label: "Titre de A à Z" },
];

function sortMovies(movies: CustomListDTO["movies"], sort: SortKey) {
  const copy = [...movies];
  if (sort === "title") return copy.sort((a, b) => a.title.localeCompare(b.title, "fr"));
  copy.sort((a, b) => a.addedAt.localeCompare(b.addedAt));
  return sort === "recent" ? copy.reverse() : copy;
}

function ListDetail({ list, isOwner }: { list: CustomListDTO; isOwner: boolean }) {
  const router = useRouter();
  const { addMovie, removeMovie, deleteList, notify } = useStreaming();
  const [dialog, setDialog] = useState<"add" | "edit" | "delete" | null>(null);
  const [sort, setSort] = useState<SortKey>("recent");
  const movies = sortMovies(list.movies, sort).map(fromListMovie);
  const cover = list.movies.find((m) => m.posterPath)?.posterPath;

  async function share() {
    if (list.visibility !== "public") {
      notify("Rendez la liste publique pour la partager : cliquez sur Modifier.", "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify("Lien copié. Toute personne qui l’ouvre pourra voir cette liste.");
    } catch {
      notify("Copie impossible. Copiez l’adresse de la page manuellement.", "error");
    }
  }

  return (
    <>
      <section className="relative isolate overflow-hidden pb-10 pt-32" aria-label={`Liste ${list.name}`}>
        {cover && <img src={`${TMDB_POSTER}${cover}`} alt="" className="absolute inset-0 -z-20 size-full scale-125 object-cover opacity-35 blur-3xl" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[var(--night)]/60 to-[var(--night)]" />
        <div className="px-4 sm:px-8">
          <Link href="/lists" className="text-sm text-[var(--mist)] hover:text-[var(--ink)]">‹ Mes listes</Link>
          <h1 className="mt-3 max-w-4xl text-[clamp(2.2rem,6vw,4.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">{list.name}</h1>
          {list.description && <p className="mt-3 max-w-2xl text-[var(--ink)]/85">{list.description}</p>}
          <p className="mt-3 flex flex-wrap gap-x-4 text-sm text-[var(--mist)]">
            <span>{list.moviesCount === 0 ? "Aucun film" : `${list.moviesCount} film${list.moviesCount > 1 ? "s" : ""}`}</span>
            <span>{list.visibility === "public" ? "Liste publique" : "Liste privée"}</span>
            {!isOwner && <span>Vous consultez la liste d’une autre personne</span>}
          </p>
          {isOwner && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" className={btnPrimary} onClick={() => setDialog("add")} disabled={list.moviesCount >= 100}>
                <span aria-hidden className="text-lg leading-none">+</span> Ajouter des films
              </button>
              <button type="button" className={btnSecondary} onClick={() => setDialog("edit")}>Modifier</button>
              <button type="button" className={btnSecondary} onClick={() => void share()}>Partager</button>
              <button type="button" className={btnDanger} onClick={() => setDialog("delete")}>Supprimer</button>
            </div>
          )}
        </div>
      </section>

      <div className="space-y-12 pb-20">
        {movies.length === 0 ? (
          <div className="px-4 sm:px-8">
            <div className="max-w-xl rounded-lg border border-dashed border-[var(--edge)] p-8">
              <h2 className="text-xl font-bold">Cette liste est vide</h2>
              <p className="mt-2 text-sm text-[var(--mist)]">
                {isOwner ? "Recherchez un film ou choisissez parmi nos suggestions pour la remplir." : "Son auteur n’y a pas encore ajouté de film."}
              </p>
              {isOwner && <button type="button" className={`${btnPrimary} mt-5`} onClick={() => setDialog("add")}>Ajouter des films</button>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
          {movies.length > 1 && (
            <div className="flex justify-end px-4 sm:px-8">
              <label className="flex items-center gap-2 text-sm text-[var(--mist)]">
                Trier par
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-md border border-[var(--edge)] bg-[var(--deep)] px-2.5 py-1.5 text-sm text-[var(--ink)] focus:border-[var(--marquee)] focus:outline-none"
                >
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
            </div>
          )}
          <ul className="grid grid-cols-3 gap-x-3 gap-y-5 px-4 sm:gap-x-4 sm:gap-y-6 sm:px-8 md:grid-cols-4 lg:grid-cols-6">
            {movies.map((m) => (
              <li key={m.movieId}>
                <MovieCard
                  movie={m}
                  listId={list.id}
                  quickAction={isOwner ? { label: `Retirer ${m.title} de la liste`, icon: "−", onClick: (movie) => void removeMovie(list.id, movie) } : undefined}
                />
              </li>
            ))}
          </ul>
          </div>
        )}

        {list.moviesCount > 0 && (
          <ListRecoRow
            listId={list.id}
            title={isOwner ? "Pour compléter cette liste" : "Dans le même esprit"}
            quickAction={
              isOwner
                ? (m) => ({
                    label: list.movieIds.includes(m.movieId) ? `${m.title} est déjà dans la liste` : `Ajouter ${m.title} à ${list.name}`,
                    icon: "+",
                    done: list.movieIds.includes(m.movieId),
                    onClick: (movie) => void addMovie(list.id, movie),
                  })
                : undefined
            }
          />
        )}
      </div>

      {isOwner && (
        <>
          <AddMoviesDialog list={list} open={dialog === "add"} onClose={() => setDialog(null)} />
          <ListFormDialog list={list} open={dialog === "edit"} onClose={() => setDialog(null)} />
          <ConfirmDialog
            open={dialog === "delete"}
            title={`Supprimer « ${list.name} » ?`}
            message={`La liste et ses ${list.moviesCount} film(s) seront supprimés. Cette action est définitive.`}
            confirmLabel="Supprimer la liste"
            onClose={() => setDialog(null)}
            onConfirm={async () => {
              setDialog(null);
              if (await deleteList(list.id)) router.push("/lists");
            }}
          />
        </>
      )}
    </>
  );
}
