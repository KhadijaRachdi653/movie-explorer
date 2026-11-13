import type { CatalogMovie } from "./catalogue";
import type { RecommendedMovie } from "./types";

// Règles de classement des recommandations (fonctions pures, testées unitairement)

export const SEED_COUNT = 3; // films de départ
export const TOP_GENRES_COUNT = 3; // genres préférés retenus
export const WEIGHTS = { occurrence: 2, genreMatch: 1, quality: 1 } as const;
export const MATCH_RANGE = { min: 55, max: 99 } as const;

/**
 * Convertit un score en pourcentage de compatibilité (55–99 %), comme sur les plateformes de streaming.
 * Score maximal possible = tous les films de départ le recommandent + tous les genres préférés + note 10/10.
 */
export function toMatchPercent(score: number, signals: Pick<UserSignals, "seeds" | "topGenres">): number {
  const maxScore =
    WEIGHTS.occurrence * Math.max(signals.seeds.length, 1) + WEIGHTS.genreMatch * signals.topGenres.length + WEIGHTS.quality;
  const ratio = Math.min(Math.max(score / maxScore, 0), 1);
  return Math.round(MATCH_RANGE.min + (MATCH_RANGE.max - MATCH_RANGE.min) * ratio);
}

export interface SignalMovie {
  movieId: string;
  title: string;
  genres: string[];
  director: string;
  addedAt: Date | string;
}

export interface UserSignals {
  seeds: { movieId: string; title: string; genres: string[]; director: string }[]; // films de départ (les plus récents)
  topGenres: string[]; // genres les plus fréquents
  excludeIds: Set<string>; // films déjà connus de l'utilisateur
}

/**
 * Construit les signaux utilisateur à partir de ses films.
 * `alsoExclude` : films à ne jamais recommander sans en faire des signaux (ex. films mal notés, déjà vus).
 */
export function buildSignals(movies: SignalMovie[], alsoExclude: string[] = [], extraGenres: string[] = []): UserSignals {
  const byRecent = [...movies].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());

  const seeds: UserSignals["seeds"] = [];
  for (const m of byRecent) {
    if (seeds.length >= SEED_COUNT) break;
    if (!seeds.some((s) => s.movieId === m.movieId)) seeds.push({ movieId: m.movieId, title: m.title, genres: m.genres, director: m.director });
  }

  const genreCount = new Map<string, number>();
  for (const m of movies) for (const g of m.genres) genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
  // Genres des recherches sauvegardées (Module 5) : comptent comme un film de ce genre
  for (const g of extraGenres) genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
  const topGenres = [...genreCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TOP_GENRES_COUNT)
    .map(([g]) => g);

  return { seeds, topGenres, excludeIds: new Set([...movies.map((m) => m.movieId), ...alsoExclude]) };
}

/** Films du catalogue proches d'un film : même réalisateur ou au moins un genre en commun. */
export function similarTo(seed: { movieId: string; genres: string[]; director: string }, catalogue: CatalogMovie[]): CatalogMovie[] {
  return catalogue.filter(
    (m) =>
      m.movieId !== seed.movieId &&
      ((seed.director !== "" && m.director === seed.director) || m.genres.some((g) => seed.genres.includes(g)))
  );
}

export interface CandidateGroup {
  seedTitle: string | null; // film à l'origine du groupe ; "" = film noté (titre inconnu) ; null = recherche par genre
  movies: CatalogMovie[];
}

/**
 * Score = 2 × nb de films de départ dont il est proche
 *       + 1 × nb de genres préférés qu'il partage
 *       + note / 10 (spectateurs, sinon catalogue)
 * Les films déjà connus sont exclus.
 */
export function rankCandidates(groups: CandidateGroup[], signals: UserSignals, limit: number): RecommendedMovie[] {
  const entries = new Map<string, { movie: CatalogMovie; occurrences: number; reason: string | null }>();
  const reasonFor = (seedTitle: string | null) =>
    seedTitle === null
      ? "Dans vos genres préférés"
      : seedTitle === ""
        ? "D’après les films que vous avez bien notés"
        : `Parce que vous avez ajouté ${seedTitle}`;

  for (const group of groups) {
    for (const movie of group.movies) {
      if (signals.excludeIds.has(movie.movieId)) continue;
      const entry = entries.get(movie.movieId);
      const fromSeed = group.seedTitle !== null;
      if (entry) {
        if (fromSeed) entry.occurrences += 1;
        if (fromSeed && entry.occurrences === 1) entry.reason = reasonFor(group.seedTitle);
      } else {
        entries.set(movie.movieId, { movie, occurrences: fromSeed ? 1 : 0, reason: reasonFor(group.seedTitle) });
      }
    }
  }

  const scored = [...entries.values()].map((e) => {
    const genreMatches = e.movie.genres.filter((g) => signals.topGenres.includes(g)).length;
    const score = WEIGHTS.occurrence * e.occurrences + WEIGHTS.genreMatch * genreMatches + WEIGHTS.quality * (e.movie.rating / 10);
    return { ...e, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.movie.movieId.localeCompare(b.movie.movieId))
    .slice(0, limit)
    .map((e) => toRecommendedMovie(e.movie, e.reason, toMatchPercent(e.score, signals)));
}

export function toRecommendedMovie(m: CatalogMovie, reason: string | null, match: number | null = null): RecommendedMovie {
  return {
    movieId: m.movieId,
    title: m.title,
    overview: m.overview,
    posterUrl: m.posterUrl,
    backdropUrl: m.backdropUrl,
    year: m.year,
    rating: Math.round(m.rating * 10) / 10,
    genres: m.genres,
    reason,
    match,
  };
}


/**
 * « Top des spectateurs » : classement par les notes des utilisateurs (Module 3), pas par la note du catalogue.
 * Moyenne pondérée (bayésienne) : score = (v × R + m × C) / (v + m)
 *   R = moyenne du film, v = nombre de votes, C = moyenne de tous les votes, m = votes minimum de confiance.
 * Un film noté 5/5 une seule fois ne passe donc pas devant un film noté 4,6/5 par vingt spectateurs.
 * Les films sans vote complètent ensuite la liste, classés par la note du catalogue.
 */
export function rankBySpectators<T extends { movieId: string; rating: number; communityVotes: number; communityAverage?: number | null }>(
  movies: T[],
  minVotes = 3
): { movie: T; score: number | null }[] {
  const voted = movies.filter((m) => m.communityVotes > 0 && m.communityAverage != null);
  const totalVotes = voted.reduce((n, m) => n + m.communityVotes, 0);
  const globalMean = totalVotes > 0 ? voted.reduce((n, m) => n + (m.communityAverage as number) * m.communityVotes, 0) / totalVotes : 0;
  const scored = voted
    .map((movie) => {
      const v = movie.communityVotes;
      return { movie, score: (v * (movie.communityAverage as number) + minVotes * globalMean) / (v + minVotes) };
    })
    .sort((a, b) => b.score - a.score || b.movie.communityVotes - a.movie.communityVotes);
  const rest = movies
    .filter((m) => !(m.communityVotes > 0 && m.communityAverage != null))
    .sort((a, b) => b.rating - a.rating)
    .map((movie) => ({ movie, score: null }));
  return [...scored, ...rest];
}
