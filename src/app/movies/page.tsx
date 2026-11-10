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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-6xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Catalogue</h1>
          <div className="flex gap-4 text-sm text-blue-400">
            <Link href="/">Accueil</Link>
            <Link href="/discover">Découvrir</Link>
            {isAdmin && <Link href="/admin/movies">Gérer</Link>}
          </div>
        </div>
        {movies.length === 0 ? (
          <p className="text-slate-400">Aucun film dans le catalogue.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {movies.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        )}
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          {current > 1 && (
            <Link href={`/movies?page=${current - 1}`}>← Précédent</Link>
          )}
          <span>
            Page {current} / {totalPages}
          </span>
          {current < totalPages && (
            <Link href={`/movies?page=${current + 1}`}>Suivant →</Link>
          )}
        </div>
      </main>
    </div>
  );
}
