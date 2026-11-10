import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovie } from "@/modules/movies/movie.service";
import { isValidMovieId } from "@/modules/movies/movie.schema";

export const dynamic = "force-dynamic";

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidMovieId(id)) notFound();
  const movie = await getMovie(id).catch(() => null);
  if (!movie) notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-4xl p-4">
        <Link href="/movies" className="text-sm text-blue-400">
          ← Catalogue
        </Link>
        <div className="mt-4 grid gap-6 sm:grid-cols-[250px_1fr]">
          {movie.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full rounded-2xl"
            />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
              Pas d&apos;affiche
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{movie.title}</h1>
            <p className="mt-1 text-slate-400">
              {movie.year} · ★ {movie.rating.toFixed(1)}
              {movie.director && ` · ${movie.director}`}
            </p>
            {movie.genres.length > 0 && (
              <p className="mt-2 text-sm text-blue-300">
                {movie.genres.join(" · ")}
              </p>
            )}
            <p className="mt-4 leading-relaxed text-slate-300">
              {movie.overview || "Aucun synopsis."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
