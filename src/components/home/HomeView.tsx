/* eslint-disable @next/next/no-img-element -- affiches du catalogue */
import Link from "next/link";
import type { MovieDto } from "@/modules/movies/movie.service";
import GenreExplorer from "./GenreExplorer";

type Props = { movies: MovieDto[]; userName: string | null; isAdmin: boolean };

// Genres les plus représentés du catalogue, avec leurs films (affiche obligatoire)
function genresWithMovies(movies: MovieDto[], max = 8) {
  const count = new Map<string, number>();
  for (const m of movies) for (const g of m.genres) count.set(g, (count.get(g) ?? 0) + 1);
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([name, n]) => ({
      name,
      count: n,
      movies: movies
        .filter((m) => m.genres.includes(name) && m.posterUrl)
        .sort((a, b) => b.rating - a.rating)
        .map((m) => ({ id: m.id, title: m.title, posterUrl: m.posterUrl!, year: m.year, rating: m.rating })),
    }));
}

// Une rangée du mur d'affiches : la liste est doublée pour boucler sans saut
function PosterLane({ posters, reverse, duration }: { posters: string[]; reverse?: boolean; duration: number }) {
  if (posters.length === 0) return null;
  return (
    <div className="poster-lane flex w-max gap-4" style={{ animationDuration: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}>
      {[...posters, ...posters].map((src, i) => (
        <img key={i} src={src} alt="" className="h-48 w-32 shrink-0 rounded-md object-cover shadow-xl shadow-black/50 sm:h-60 sm:w-40" />
      ))}
    </div>
  );
}

/** Page d'accueil (présentation seule : les données arrivent de la page). */
export default function HomeView({ movies, userName, isAdmin }: Props) {
  const topRated = [...movies].sort((a, b) => b.rating - a.rating);
  const newest = [...movies].sort((a, b) => b.year - a.year);
  const withPoster = topRated.filter((m) => m.posterUrl);
  const featured = withPoster[0] ?? null;
  const spotlight = withPoster.slice(1, 5);
  const posters = movies.map((m) => m.posterUrl).filter((u): u is string => Boolean(u));
  const lanes = [0, 1, 2].map((k) => posters.filter((_, i) => i % 3 === k).slice(0, 12));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ===== Vitrine : mur d'affiches animé ===== */}
      <section className="relative isolate flex min-h-[max(88vh,600px)] items-center overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-20 flex -rotate-[8deg] scale-125 flex-col justify-center gap-4 opacity-55">
          <PosterLane posters={lanes[0]} duration={90} />
          <PosterLane posters={lanes[1]} duration={110} reverse />
          <PosterLane posters={lanes[2]} duration={100} />
        </div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(7,11,22,0.55)_0%,rgba(7,11,22,0.92)_60%,var(--night)_100%)]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[var(--night)] to-transparent" />

        <div className="mx-auto max-w-4xl px-4 pt-24 text-center sm:px-8">
          {userName && (
            <p className="hero-text mb-5 text-[var(--mist)]">
              Ravi de vous revoir, <strong className="text-[var(--ink)]">{userName}</strong>
            </p>
          )}
          <h1 className="hero-text text-balance text-[clamp(2.8rem,8vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.04em]">
            Tous vos films, <span className="text-[var(--marquee)]">au même endroit.</span>
          </h1>
          <p className="hero-text mx-auto mt-6 max-w-2xl text-lg text-[var(--ink)]/80 sm:text-xl [animation-delay:120ms]">
            Explorez le catalogue, rangez vos films dans des listes, recevez des recommandations sur mesure et partagez vos avis.
          </p>
          <div className="hero-text mt-10 flex flex-wrap justify-center gap-3 [animation-delay:200ms]">
            <Link href="/discover" className="rounded-md bg-[var(--marquee)] px-7 py-3.5 text-lg font-semibold text-[#1a1203] shadow-lg shadow-black/40 transition-colors hover:bg-[#f7c766]">
              Découvrir des films
            </Link>
            {userName ? (
              <Link href="/recommendations" className="rounded-md bg-white/10 px-7 py-3.5 text-lg font-semibold backdrop-blur transition-colors hover:bg-white/20">
                Mes recommandations
              </Link>
            ) : (
              <Link href="/register" className="rounded-md bg-white/10 px-7 py-3.5 text-lg font-semibold backdrop-blur transition-colors hover:bg-white/20">
                Créer un compte
              </Link>
            )}
          </div>
          {isAdmin && (
            <p className="hero-text mt-6 [animation-delay:260ms]">
              <Link href="/admin/movies" className="text-sm text-[var(--mist)] underline-offset-4 hover:text-[var(--ink)] hover:underline">Gérer les films</Link>
            </p>
          )}
        </div>
      </section>

      <main className="space-y-20 pb-20">
        {/* ===== À la une : mosaïque éditoriale ===== */}
        {featured && (
          <section aria-labelledby="featured-title" className="px-4 sm:px-8">
            <h2 id="featured-title" className="text-[clamp(1.8rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.03em]">À la une</h2>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              {/* Grand bloc : le mieux noté */}
              <Link href={`/movies/${featured.id}`} className="group relative isolate flex min-h-[420px] overflow-hidden rounded-2xl border border-[var(--edge)]">
                <img src={featured.posterUrl!} alt="" className="absolute inset-0 -z-20 size-full scale-125 object-cover opacity-50 blur-2xl transition-transform duration-700 group-hover:scale-[1.3]" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--night)] via-[var(--night)]/80 to-transparent" />
                <div className="flex w-full items-end gap-6 p-6 sm:p-8">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--marquee)]">Le mieux noté du catalogue</p>
                    <h3 className="mt-2 text-balance text-[clamp(1.9rem,3.6vw,3.25rem)] font-extrabold leading-[0.95] tracking-[-0.03em] group-hover:text-[var(--marquee)]">{featured.title}</h3>
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--mist)]">
                      <span><span aria-hidden className="text-[var(--marquee)]">★ </span>{featured.rating.toFixed(1)} / 10</span>
                      <span>{featured.year}</span>
                      {featured.genres.slice(0, 3).map((g) => (
                        <span key={g} className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-[var(--ink)]/85">{g}</span>
                      ))}
                    </div>
                    {featured.overview && <p className="mt-4 line-clamp-3 max-w-xl text-[var(--ink)]/85">{featured.overview}</p>}
                    <span className="mt-6 inline-block rounded-md bg-[var(--marquee)] px-5 py-2.5 font-semibold text-[#1a1203]">Voir la fiche</span>
                  </div>
                  <img src={featured.posterUrl!} alt="" className="hidden w-40 shrink-0 rounded-lg shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:block xl:w-48" />
                </div>
              </Link>

              {/* 4 suivants : affiches avec titre en surimpression */}
              <ul className="grid grid-cols-2 gap-4">
                {spotlight.map((m) => (
                  <li key={m.id}>
                    <Link href={`/movies/${m.id}`} className="group relative block h-full overflow-hidden rounded-xl border border-[var(--edge)]" aria-label={`${m.title}, ${m.rating.toFixed(1)} sur 10`}>
                      <img src={m.posterUrl!} alt="" loading="lazy" className="aspect-[3/4] size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-12">
                        <span className="line-clamp-2 font-bold leading-tight group-hover:text-[var(--marquee)]">{m.title}</span>
                        <span className="mt-1 block text-xs text-[var(--mist)]"><span className="text-[var(--marquee)]">★</span> {m.rating.toFixed(1)} · {m.year}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ===== Explorer par genre (interactif) ===== */}
        <GenreExplorer genres={genresWithMovies(movies)} />

        {/* ===== Sorties récentes : cartes « billet de cinéma » ===== */}
        {newest.length > 0 && (
          <section aria-labelledby="recent-title">
            <div className="flex flex-wrap items-end justify-between gap-4 px-4 sm:px-8">
              <h2 id="recent-title" className="text-[clamp(1.8rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.03em]">Sorties récentes</h2>
              <Link href="/movies" className="text-sm font-semibold text-[var(--marquee)] hover:underline">Tout le catalogue</Link>
            </div>
            <ul className="no-scrollbar mt-6 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:scroll-px-8 sm:px-8">
              {newest.filter((m) => m.posterUrl).slice(0, 12).map((m) => (
                <li key={m.id} className="w-[82vw] shrink-0 snap-start sm:w-[400px]">
                  <Link href={`/movies/${m.id}`} className="group flex h-full gap-4 rounded-xl border border-[var(--edge)] bg-[var(--deep)] p-3 transition-colors hover:border-[var(--marquee)]/70">
                    <img src={m.posterUrl!} alt="" loading="lazy" className="w-24 shrink-0 rounded-md object-cover sm:w-28" />
                    <span className="flex min-w-0 flex-col py-1">
                      <span className="text-xs font-semibold text-[var(--marquee)]">{m.year}</span>
                      <span className="mt-1 line-clamp-2 text-lg font-bold leading-tight group-hover:text-[var(--marquee)]">{m.title}</span>
                      <span className="mt-2 line-clamp-1 text-xs text-[var(--mist)]">{m.genres.slice(0, 3).join(", ")}</span>
                      {m.overview && <span className="mt-2 line-clamp-2 text-sm text-[var(--ink)]/75">{m.overview}</span>}
                      <span className="mt-auto pt-2 text-sm"><span className="text-[var(--marquee)]">★</span> {m.rating.toFixed(1)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {movies.length === 0 && <p className="px-4 text-[var(--mist)] sm:px-8">Le catalogue est vide pour le moment.</p>}

        {/* ===== Bandeau final ===== */}
        <section className="px-4 sm:px-8">
          <div className="relative isolate overflow-hidden rounded-2xl border border-[var(--edge)] bg-[var(--deep)] px-6 py-12 text-center sm:px-12">
            <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,rgba(242,181,68,0.18),transparent_60%)]" />
            <h2 className="text-balance text-[clamp(1.8rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.03em]">
              {userName ? "Vos prochaines soirées cinéma vous attendent" : "Prêt pour votre prochaine soirée cinéma ?"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--mist)]">
              {userName
                ? "Rangez vos films dans des listes : vos recommandations s’adaptent à vos goûts."
                : "Créez un compte gratuit pour garder vos listes, noter les films et recevoir des recommandations."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={userName ? "/lists" : "/register"} className="rounded-md bg-[var(--marquee)] px-6 py-3 font-semibold text-[#1a1203] hover:bg-[#f7c766]">
                {userName ? "Mes listes" : "Créer un compte"}
              </Link>
              <Link href="/movies" className="rounded-md bg-white/10 px-6 py-3 font-semibold hover:bg-white/20">Voir tout le catalogue</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
