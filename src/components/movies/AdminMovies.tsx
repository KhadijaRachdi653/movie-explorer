"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { MovieDto } from "@/modules/movies/movie.service";

const empty = {
  title: "",
  overview: "",
  posterUrl: "",
  year: "",
  genres: "",
  director: "",
  rating: "",
};
type Form = typeof empty;

const input =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500";

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminMovies({ movies }: { movies: MovieDto[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<MovieDto | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function openCreate() {
    setEditingId(null);
    setError("");
    setForm(empty);
  }

  function openEdit(m: MovieDto) {
    setEditingId(m.id);
    setError("");
    setForm({
      ...m,
      year: String(m.year),
      rating: String(m.rating),
      genres: m.genres.join(", "),
    });
  }

  function close() {
    setForm(null);
    setToDelete(null);
    setError("");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setError("");
    const res = await fetch(
      editingId ? `/api/movies/${editingId}` : "/api/movies",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          genres: form.genres
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean),
          rating: form.rating === "" ? 0 : form.rating,
        }),
      },
    );
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Erreur.");
      return;
    }
    close();
    router.refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    const res = await fetch(`/api/movies/${toDelete.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Erreur.");
      return;
    }
    close();
    router.refresh();
  }

  const set = (k: keyof Form) => (e: { target: { value: string } }) =>
    form && setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {movies.length} film(s) dans le catalogue
        </p>
        <button
          onClick={openCreate}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
        >
          + Ajouter un film
        </button>
      </div>

      {movies.length === 0 ? (
        <p className="text-slate-400">Aucun film.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {movies.map((m) => (
            <div
              key={m.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
            >
              {m.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.posterUrl}
                  alt={m.title}
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center bg-slate-800 text-slate-500">
                  Pas d&apos;affiche
                </div>
              )}
              <div className="p-3">
                <p className="truncate font-semibold">{m.title}</p>
                <p className="text-sm text-slate-400">
                  {m.year} · ★ {m.rating.toFixed(1)}
                </p>
              </div>
              <div className="absolute inset-x-0 top-0 flex justify-end gap-2 p-2 transition sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  onClick={() => openEdit(m)}
                  className="rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-blue-600"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setToDelete(m)}
                  className="rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-medium text-red-300 backdrop-blur hover:bg-red-600 hover:text-white"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal
          title={editingId ? "Modifier le film" : "Ajouter un film"}
          onClose={close}
        >
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <input
              className={`${input} sm:col-span-2`}
              placeholder="Titre"
              value={form.title}
              onChange={set("title")}
              required
            />
            <input
              className={input}
              placeholder="Année"
              type="number"
              value={form.year}
              onChange={set("year")}
              required
            />
            <input
              className={input}
              placeholder="Note (0-10)"
              type="number"
              step="0.1"
              value={form.rating}
              onChange={set("rating")}
            />
            <input
              className={input}
              placeholder="Réalisateur"
              value={form.director}
              onChange={set("director")}
            />
            <input
              className={input}
              placeholder="Genres (séparés par des virgules)"
              value={form.genres}
              onChange={set("genres")}
            />
            <input
              className={`${input} sm:col-span-2`}
              placeholder="URL de l'affiche"
              value={form.posterUrl}
              onChange={set("posterUrl")}
            />
            <textarea
              className={`${input} sm:col-span-2`}
              rows={4}
              placeholder="Synopsis"
              value={form.overview}
              onChange={set("overview")}
            />
            {error && (
              <p className="text-sm text-red-400 sm:col-span-2">{error}</p>
            )}
            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={close}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                disabled={busy}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {editingId ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <Modal title="Supprimer le film" onClose={close}>
          <p className="text-sm text-slate-300">
            Voulez-vous vraiment supprimer{" "}
            <strong className="text-white">{toDelete.title}</strong> ? Cette
            action est irréversible.
          </p>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={close}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              disabled={busy}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
