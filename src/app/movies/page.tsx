import Link from "next/link";
import MovieCard from "@/components/movies/MovieCard";
import { listMovies } from "@/modules/movies/movie.service";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catalogue" };

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);
  const [{ movies, totalPages }, session] = await Promise.all([
    listMovies(current, 12),
    auth(),
  ]);
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === "admin";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] transition-colors">
      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Catalogue</h1>
          <div className="flex gap-4 text-sm font-semibold text-[var(--accent)]">
            <Link href="/" className="hover:underline">
              Accueil
            </Link>
            <Link href="/discover" className="hover:underline">
              Découvrir
            </Link>
            {isAdmin && (
              <Link href="/admin/movies" className="hover:underline">
                Gérer
              </Link>
            )}
          </div>
        </div>
        {movies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--surface-variant)] bg-[var(--surface)]/50 p-8 text-center text-sm text-[var(--text-muted)]">
            Aucun film dans le catalogue.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {movies.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        )}
        <div className="mt-8 flex items-center justify-center gap-4 text-sm font-medium text-[var(--text-muted)]">
          {current > 1 && (
            <Link
              href={`/movies?page=${current - 1}`}
              className="rounded-lg border border-[var(--surface-variant)] bg-[var(--surface)] px-3 py-1.5 text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            >
              ← Précédent
            </Link>
          )}
          <span>
            Page {current} / {totalPages}
          </span>
          {current < totalPages && (
            <Link
              href={`/movies?page=${current + 1}`}
              className="rounded-lg border border-[var(--surface-variant)] bg-[var(--surface)] px-3 py-1.5 text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            >
              Suivant →
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
