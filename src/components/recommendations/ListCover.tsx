/* eslint-disable @next/next/no-img-element -- images TMDB externes */
import type { CustomListDTO } from "@/modules/recommendations/types";
import { TMDB_POSTER } from "./movie";

// Position des affiches en éventail : 1 = centrée, 2 = paire symétrique, 3 = centre + côtés
const FAN_PAIR = ["z-20 -translate-x-[88%] -rotate-[6deg]", "z-10 -translate-x-[12%] rotate-[6deg] translate-y-1"];
const FAN = [
  "z-20 -translate-x-1/2",
  "z-10 -translate-x-[115%] -rotate-[9deg] translate-y-2 opacity-90",
  "z-10 translate-x-[15%] rotate-[9deg] translate-y-2 opacity-90",
];

// Couverture d'une liste : ses dernières affiches en éventail sur un fond flouté
export default function ListCover({ list }: { list: CustomListDTO }) {
  const posters = list.movies.filter((m) => m.posterPath).slice(-3).reverse();

  if (posters.length === 0) {
    return (
      <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_top,var(--raised),var(--deep)_70%)] text-center">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-full border border-[var(--marquee)]/60 text-2xl text-[var(--marquee)]">+</span>
        <span className="text-sm text-[var(--mist)]">Ajoutez vos premiers films</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-[var(--deep)]">
      <img src={`${TMDB_POSTER}${posters[0].posterPath}`} alt="" className="absolute inset-0 size-full scale-125 object-cover opacity-30 blur-2xl" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--deep)] to-transparent" />
      {posters.map((m, i) => (
        <img
          key={m.movieId}
          src={`${TMDB_POSTER}${m.posterPath}`}
          alt=""
          className={`absolute left-1/2 top-[12%] h-[80%] rounded-md shadow-2xl shadow-black/60 ring-1 ring-white/10 transition-transform duration-300 ${posters.length === 2 ? FAN_PAIR[i] : FAN[i]}`}
        />
      ))}
    </div>
  );
}
