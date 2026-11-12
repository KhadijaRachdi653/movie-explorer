import Link from "next/link";
import type { MovieDto } from "@/modules/movies/movie.service";
import FavoriteBadge from "@/components/collection/FavoriteBadge";

// Carte d'affiche (thème unifié) : affiche, titre, année et note
export default function MovieCard({ movie }: { movie: MovieDto }) {
  return (
    <Link href={`/movies/${movie.id}`} className="group block" aria-label={`${movie.title}, ${movie.year}`}>
      <div className="relative overflow-hidden rounded-md bg-[var(--deep)] ring-1 ring-white/5 transition duration-200 group-hover:-translate-y-1 group-hover:ring-[var(--marquee)]/70">
        <FavoriteBadge movieId={movie.id} />
        {movie.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={movie.posterUrl} alt="" loading="lazy" className="aspect-[2/3] w-full object-cover" />
        ) : (
          <div className="flex aspect-[2/3] items-end bg-gradient-to-br from-[var(--raised)] to-[var(--deep)] p-3">
            <span className="line-clamp-3 text-sm font-semibold text-[var(--mist)]">{movie.title}</span>
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-sm font-medium group-hover:text-[var(--marquee)]">{movie.title}</p>
      <p className="text-xs text-[var(--mist)]">
        <span aria-hidden className="text-[var(--marquee)]">★ </span>
        {movie.rating.toFixed(1)}
        <span className="ml-2">{movie.year}</span>
      </p>
    </Link>
  );
}
