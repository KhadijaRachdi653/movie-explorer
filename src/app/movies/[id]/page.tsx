import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovie } from "@/modules/movies/movie.service";
import { isValidMovieId } from "@/modules/movies/movie.schema";
import MovieReviewsSection from "@/components/reviews/MovieReviewsSection";
import CollectionActions from "@/components/collection/CollectionActions";
import { getRatingSummary } from "@/modules/reviews/review.service";

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
  const community = await getRatingSummary(id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Bannière : affiche floutée en fond, comme sur les plateformes de streaming */}
      <section className="relative isolate overflow-hidden pt-16">
        {movie.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={movie.posterUrl} alt="" className="absolute inset-0 -z-20 size-full scale-125 object-cover opacity-35 blur-3xl" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--night)]/30 via-[var(--night)]/70 to-[var(--night)]" />

        <div className="px-4 pb-12 pt-8 sm:px-8">
          <Link href="/movies" className="text-sm text-[var(--mist)] hover:text-[var(--ink)]">‹ Catalogue</Link>
          <div className="mt-6 grid gap-8 sm:grid-cols-[minmax(0,260px)_1fr] lg:gap-12">
            <div className="mx-auto w-48 sm:mx-0 sm:w-full">
              {movie.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={movie.posterUrl} alt={`Affiche de ${movie.title}`} className="w-full rounded-lg shadow-2xl shadow-black/60 ring-1 ring-white/10" />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center rounded-lg bg-[var(--raised)] text-[var(--mist)]">
                  Pas d&apos;affiche
                </div>
              )}
            </div>
            <div className="max-w-3xl self-center">
              <h1 className="text-balance text-[clamp(2.2rem,5vw,4.25rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">{movie.title}</h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--mist)]">
                <span>{movie.year}</span>
                {movie.director && <span>Réalisé par <span className="text-[var(--ink)]">{movie.director}</span></span>}
                <span><span aria-hidden className="text-[var(--marquee)]">★ </span>{movie.rating.toFixed(1)} / 10</span>
                {community.count > 0 && (
                  <a href="#avis" className="font-semibold text-[var(--marquee)] hover:underline">
                    {community.average.toFixed(1)}/5 · {community.count} vote{community.count > 1 ? "s" : ""} des spectateurs
                  </a>
                )}
              </div>
              {movie.genres.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Genres">
                  {movie.genres.map((g) => (
                    <li key={g} className="rounded-full border border-white/20 px-3 py-1 text-xs text-[var(--ink)]/85">{g}</li>
                  ))}
                </ul>
              )}
              <p className="mt-6 max-w-prose text-[17px] leading-relaxed text-[var(--ink)]/85">
                {movie.overview || "Aucun synopsis."}
              </p>
              <div className="mt-8">
                <CollectionActions movie={movie} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="#avis" className="rounded-md bg-[var(--marquee)] px-5 py-3 font-semibold text-[#1a1203] hover:bg-[#f7c766]">Noter et donner mon avis</a>
                <Link href="/recommendations" className="rounded-md bg-white/10 px-5 py-3 font-semibold backdrop-blur hover:bg-white/20">Mes recommandations</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="px-4 pb-20 sm:px-8">
        <MovieReviewsSection movieId={movie.id} />
      </main>
    </div>
  );
}
