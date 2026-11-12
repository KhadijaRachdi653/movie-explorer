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
  const [{ movies, totalPages, total }, session] = await Promise.all([
    listMovies(current, 12),
    auth(),
  ]);
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === "admin";

  const pill = "rounded-full border border-[var(--edge)] px-4 py-2 text-sm hover:border-[var(--marquee)] hover:text-[var(--marquee)]";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="px-4 pb-20 pt-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Catalogue</h1>
            <p className="mt-2 text-[var(--mist)]">{total} film{total > 1 ? "s" : ""}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/discover" className="rounded-md bg-[var(--marquee)] px-4 py-2.5 text-sm font-semibold text-[#1a1203] hover:bg-[#f7c766]">
              Rechercher et filtrer
            </Link>
            {isAdmin && (
              <Link href="/admin/movies" className="rounded-md bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20">
                Gérer les films
              </Link>
            )}
          </div>
        </div>

        {movies.length === 0 ? (
          <p className="mt-16 text-[var(--mist)]">Aucun film dans le catalogue.</p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {movies.map((m) => (
              <li key={m.id}>
                <MovieCard movie={m} />
              </li>
            ))}
          </ul>
        )}

        <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-3">
          {current > 1 ? (
            <Link href={`/movies?page=${current - 1}`} className={pill}>‹ Précédent</Link>
          ) : (
            <span className={`${pill} pointer-events-none opacity-40`} aria-hidden>‹ Précédent</span>
          )}
          <span className="px-2 text-sm text-[var(--mist)]">
            Page <strong className="text-[var(--ink)]">{current}</strong> sur {totalPages}
          </span>
          {current < totalPages ? (
            <Link href={`/movies?page=${current + 1}`} className={pill}>Suivant ›</Link>
          ) : (
            <span className={`${pill} pointer-events-none opacity-40`} aria-hidden>Suivant ›</span>
          )}
        </nav>
      </main>
    </div>
  );
}
