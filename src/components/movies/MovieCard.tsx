import Link from "next/link";
import type { MovieDto } from "@/modules/movies/movie.service";

export default function MovieCard({ movie }: { movie: MovieDto }) {
  return (
    <Link href={`/movies/${movie.id}`} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition hover:border-blue-500">
      {movie.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={movie.posterUrl} alt={movie.title} className="aspect-[2/3] w-full object-cover" />
      ) : (
        <div className="flex aspect-[2/3] items-center justify-center bg-slate-800 text-slate-500">Pas d&apos;affiche</div>
      )}
      <div className="p-3">
        <p className="truncate font-semibold">{movie.title}</p>
        <p className="text-sm text-slate-400">
          {movie.year} · ★ {movie.rating.toFixed(1)}
        </p>
      </div>
    </Link>
  );
}
