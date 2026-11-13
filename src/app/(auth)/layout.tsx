/* eslint-disable @next/next/no-img-element -- affiches du catalogue */
import Link from "next/link";
import { listMovies } from "@/modules/movies/movie.service";

// Écran partagé « cinéma » : mur d'affiches du catalogue + formulaire
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { movies } = await listMovies(1, 24).catch(() => ({ movies: [] as { id: string; posterUrl: string }[] }));
  const posters = movies.map((m) => m.posterUrl).filter(Boolean).slice(0, 18);

  return (
    <div className="relative grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1.1fr_1fr]">
      {/* Mur d'affiches (grand écran) ou fond flouté (mobile) */}
      <div aria-hidden className="absolute inset-0 overflow-hidden lg:relative">
        <div className="grid h-full -rotate-6 scale-125 grid-cols-3 gap-3 opacity-40 sm:grid-cols-4 lg:opacity-70">
          {posters.map((src, i) => (
            <img key={i} src={src} alt="" className="aspect-[2/3] w-full rounded-md object-cover" />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--night)] via-[var(--night)]/70 to-[var(--night)]/40 lg:bg-gradient-to-r lg:from-[var(--night)]/20 lg:via-[var(--night)]/60 lg:to-[var(--night)]" />
        <div className="absolute bottom-10 left-8 right-8 hidden max-w-md lg:block">
          <p className="text-[clamp(2rem,3.2vw,3rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
            Vos films, vos listes, vos avis.
          </p>
          <p className="mt-3 text-[var(--ink)]/80">Un seul compte pour tout retrouver sur Movie Explorer.</p>
        </div>
      </div>

      <div className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          {children}
          <p className="mt-8 text-center text-xs text-[var(--mist)]">
            <Link href="/" className="hover:text-[var(--ink)]">‹ Retour à l’accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
