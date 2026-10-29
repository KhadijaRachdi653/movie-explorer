import { posterUrl, type TmdbMovie } from "@/lib/tmdb";
import type { RecommendedMovie } from "./types";

// Règles de classement des recommandations (fonctions pures, testées unitairement)

export const SEED_COUNT = 3; // films de départ
export const TOP_GENRES_COUNT = 3; // genres préférés retenus
export const WEIGHTS = { occurrence: 2, genreMatch: 1, quality: 1 } as const;

export interface SignalMovie {
  movieId: number;
  title: string;
  genreIds: number[];
  addedAt: Date | string;
}

export interface UserSignals {
  seeds: { movieId: number; title: string }[]; // films de départ (les plus récents)
  topGenres: number[]; // genres les plus fréquents
  excludeIds: Set<number>; // films déjà connus de l'utilisateur
}

/** Construit les signaux utilisateur à partir de ses films. */
export function buildSignals(movies: SignalMovie[]): UserSignals {
  const byRecent = [...movies].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

  const seeds: { movieId: number; title: string }[] = [];
  for (const m of byRecent) {
    if (seeds.length >= SEED_COUNT) break;
    if (!seeds.some((s) => s.movieId === m.movieId)) seeds.push({ movieId: m.movieId, title: m.title });
  }

  const genreCount = new Map<number, number>();
  for (const m of movies) for (const g of m.genreIds) genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
  const topGenres = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .slice(0, TOP_GENRES_COUNT)
    .map(([g]) => g);

  return { seeds, topGenres, excludeIds: new Set(movies.map((m) => m.movieId)) };
}

export interface CandidateGroup {
  seedTitle: string | null; // film à l'origine du groupe (null = recherche par genre)
  movies: TmdbMovie[];
}

/**
 * Score = 2 × nb de films de départ qui le recommandent
 *       + 1 × nb de genres préférés qu'il partage
 *       + note TMDB / 10
 * Les films déjà connus sont exclus.
 */
export function rankCandidates(groups: CandidateGroup[], signals: UserSignals, limit: number): RecommendedMovie[] {
  const entries = new Map<number, { movie: TmdbMovie; occurrences: number; reason: string | null }>();

  for (const group of groups) {
    for (const movie of group.movies) {
      if (signals.excludeIds.has(movie.id)) continue;
      const entry = entries.get(movie.id);
      if (entry) {
        if (group.seedTitle) entry.occurrences += 1;
        entry.reason ??= group.seedTitle ? `Parce que vous avez ajouté ${group.seedTitle}` : null;
      } else {
        entries.set(movie.id, {
          movie,
          occurrences: group.seedTitle ? 1 : 0,
          reason: group.seedTitle ? `Parce que vous avez ajouté ${group.seedTitle}` : "Dans vos genres préférés",
        });
      }
    }
  }

  const scored = [...entries.values()].map((e) => {
    const genreMatches = (e.movie.genre_ids ?? []).filter((g) => signals.topGenres.includes(g)).length;
    const score =
      WEIGHTS.occurrence * e.occurrences +
      WEIGHTS.genreMatch * genreMatches +
      WEIGHTS.quality * ((e.movie.vote_average ?? 0) / 10);
    return { ...e, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.movie.id - b.movie.id)
    .slice(0, limit)
    .map((e) => toRecommendedMovie(e.movie, e.reason));
}

export function toRecommendedMovie(m: TmdbMovie, reason: string | null): RecommendedMovie {
  return {
    movieId: m.id,
    title: m.title,
    overview: m.overview ?? "",
    posterUrl: posterUrl(m.poster_path),
    releaseDate: m.release_date || null,
    rating: m.vote_average ?? 0,
    genreIds: m.genre_ids ?? [],
    reason,
  };
}
