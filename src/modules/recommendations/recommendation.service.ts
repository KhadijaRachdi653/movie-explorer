import dbConnect from "@/lib/mongodb";
import { tmdbFetch, type TmdbMovie, type TmdbPage } from "@/lib/tmdb";
import CustomList, { type CustomListDoc } from "./customList.model";
import { getList } from "./customList.service";
import { buildSignals, rankCandidates, toRecommendedMovie, type CandidateGroup, type SignalMovie } from "./ranking";
import type { RecommendationsResponse } from "./types";

/**
 * Récupère les films « signaux » de l'utilisateur.
 * Aujourd'hui : films de ses listes personnalisées.
 * Point d'intégration : ajouter ici les favoris (Module 4) et les films bien notés (Module 3)
 * au même format SignalMovie.
 */
async function getUserSignalMovies(userId: string): Promise<SignalMovie[]> {
  await dbConnect();
  const lists = await CustomList.find({ userId }, "movies").lean<Pick<CustomListDoc, "movies">[]>();
  return lists.flatMap((l) => l.movies.map((m) => ({ movieId: m.movieId, title: m.title, genreIds: m.genreIds ?? [], addedAt: m.addedAt })));
}

async function fetchPage(path: string, params: Record<string, string | number> = {}): Promise<TmdbMovie[]> {
  try {
    const data = await tmdbFetch<TmdbPage<TmdbMovie>>(path, params);
    return data.results;
  } catch (err) {
    console.error(`Erreur TMDB ${path} :`, err);
    return []; // un appel en échec ne bloque pas les autres
  }
}

async function trending(limit: number): Promise<RecommendationsResponse> {
  const movies = await tmdbFetch<TmdbPage<TmdbMovie>>("/trending/movie/week");
  return { source: "trending", results: movies.results.slice(0, limit).map((m) => toRecommendedMovie(m, "Tendance cette semaine")) };
}

/** Films similaires à un film (page détail). */
export async function getSimilarMovies(movieId: number, limit: number): Promise<RecommendationsResponse> {
  const data = await tmdbFetch<TmdbPage<TmdbMovie>>(`/movie/${movieId}/recommendations`);
  return { source: "similar", results: data.results.slice(0, limit).map((m) => toRecommendedMovie(m, null)) };
}

/**
 * Recommandations personnalisées ; tendances si aucun signal (ou utilisateur non connecté).
 * Avec listId : seuls les films de cette liste servent de signaux (droits de lecture vérifiés : 403/404).
 */
export async function getPersonalRecommendations(userId: string | null, limit: number, listId?: string): Promise<RecommendationsResponse> {
  let signalMovies: SignalMovie[];
  if (listId) {
    const list = await getList(listId, userId);
    signalMovies = list.movies;
  } else {
    if (!userId) return trending(limit);
    signalMovies = await getUserSignalMovies(userId);
  }

  const signals = buildSignals(signalMovies);
  if (signals.seeds.length === 0) return trending(limit);

  const groups: CandidateGroup[] = await Promise.all(
    signals.seeds.map(async (s) => ({ seedTitle: s.title, movies: await fetchPage(`/movie/${s.movieId}/recommendations`) }))
  );
  if (signals.topGenres.length > 0) {
    // "|" = OU entre genres pour TMDB
    groups.push({
      seedTitle: null,
      movies: await fetchPage("/discover/movie", { with_genres: signals.topGenres.join("|"), sort_by: "popularity.desc", "vote_count.gte": 100 }),
    });
  }

  const results = rankCandidates(groups, signals, limit);
  return results.length > 0 ? { source: listId ? "list" : "personal", results } : trending(limit);
}
