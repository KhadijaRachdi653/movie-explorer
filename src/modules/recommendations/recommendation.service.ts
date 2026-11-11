import mongoose, { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import { tmdbFetch, type TmdbMovie, type TmdbPage } from "@/lib/tmdb";
import CustomList, { type CustomListDoc } from "./customList.model";
import { getList } from "./customList.service";
import { buildSignals, rankCandidates, toRecommendedMovie, type CandidateGroup, type SignalMovie } from "./ranking";
import type { RecommendationsResponse } from "./types";
import { ApiError, MOVIES_UNAVAILABLE } from "./errors";

/**
 * Films « signaux » de l'utilisateur :
 * - les films de ses listes personnalisées (Module 6) ;
 * - ses favoris (Module 4, collection `collectionItems`, `favorite: true`) ;
 * - les films qu'il a bien notés (Module 3, collection `ratings`, note ≥ 4/5).
 * Favoris et notes sont lus directement en base pour ne pas dépendre du code des autres modules :
 * tant qu'ils ne sont pas fusionnés, les collections sont vides et rien ne change.
 */
async function getUserSignalMovies(userId: string): Promise<{ movies: SignalMovie[]; alreadySeen: number[] }> {
  await dbConnect();
  const lists = await CustomList.find({ userId }, "movies").lean<Pick<CustomListDoc, "movies">[]>();
  const fromLists = lists.flatMap((l) =>
    l.movies.map((m) => ({ movieId: m.movieId, title: m.title, genreIds: m.genreIds ?? [], addedAt: m.addedAt }))
  );
  const [favorites, rated] = await Promise.all([getFavoriteSignalMovies(userId), getRatedMovies(userId)]);
  // Films déjà notés (même mal) : déjà vus, donc jamais recommandés
  return { movies: [...fromLists, ...favorites, ...rated.liked], alreadySeen: rated.ratedIds };
}

export const RATING_LIKED_MIN = 4; // note sur 5 à partir de laquelle un film est « aimé »

interface RatingDoc {
  movieId?: number;
  score?: number;
  updatedAt?: Date;
}

/** Notes de l'utilisateur : films aimés (signaux) et tous les films notés (déjà vus, à exclure). */
async function getRatedMovies(userId: string): Promise<{ liked: SignalMovie[]; ratedIds: number[] }> {
  const db = mongoose.connection.db;
  if (!db || !Types.ObjectId.isValid(userId)) return { liked: [], ratedIds: [] };
  try {
    const ratings = await db
      .collection<RatingDoc>("ratings")
      .find({ userId: new Types.ObjectId(userId) }, { projection: { movieId: 1, score: 1, updatedAt: 1 } })
      .sort({ updatedAt: -1 })
      .limit(200)
      .toArray();
    const valid = ratings.filter((r) => typeof r.movieId === "number" && typeof r.score === "number");
    return {
      // titre inconnu (non stocké par le Module 3) : "" donne la raison « D'après les films que vous avez bien notés »
      liked: valid
        .filter((r) => r.score! >= RATING_LIKED_MIN)
        .map((r) => ({ movieId: r.movieId!, title: "", genreIds: [], addedAt: r.updatedAt ?? new Date(0) })),
      ratedIds: valid.map((r) => r.movieId!),
    };
  } catch (err) {
    console.error("Lecture des notes impossible :", err);
    return { liked: [], ratedIds: [] };
  }
}

interface FavoriteItem {
  movie?: { movieId?: number; title?: string; genreIds?: number[] };
  updatedAt?: Date;
}

async function getFavoriteSignalMovies(userId: string): Promise<SignalMovie[]> {
  const db = mongoose.connection.db;
  if (!db || !Types.ObjectId.isValid(userId)) return [];
  try {
    const items = await db
      .collection<FavoriteItem>("collectionItems")
      .find({ userId: new Types.ObjectId(userId), favorite: true }, { projection: { movie: 1, updatedAt: 1 } })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();
    return items
      .filter((i) => typeof i.movie?.movieId === "number" && typeof i.movie?.title === "string")
      .map((i) => ({
        movieId: i.movie!.movieId!,
        title: i.movie!.title!,
        genreIds: i.movie!.genreIds ?? [],
        addedAt: i.updatedAt ?? new Date(0),
      }));
  } catch (err) {
    console.error("Lecture des favoris impossible :", err);
    return []; // les favoris améliorent les recommandations mais ne doivent jamais les bloquer
  }
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

/** Tendances de la semaine (rangée « Tendances » et repli sans signal). */
export async function getTrending(limit: number): Promise<RecommendationsResponse> {
  return trending(limit);
}

// Appel TMDB indispensable : s'il échoue, 503 avec un message clair (et le détail dans le terminal)
async function tmdbRequired<T>(path: string): Promise<T> {
  try {
    return await tmdbFetch<T>(path);
  } catch (err) {
    throw new ApiError(503, MOVIES_UNAVAILABLE, { cause: err });
  }
}

async function trending(limit: number): Promise<RecommendationsResponse> {
  const movies = await tmdbRequired<TmdbPage<TmdbMovie>>("/trending/movie/week");
  return { source: "trending", results: movies.results.slice(0, limit).map((m) => toRecommendedMovie(m, "Tendance cette semaine")) };
}

/** Films similaires à un film (page détail). */
export async function getSimilarMovies(movieId: number, limit: number): Promise<RecommendationsResponse> {
  const data = await tmdbRequired<TmdbPage<TmdbMovie>>(`/movie/${movieId}/recommendations`);
  return { source: "similar", results: data.results.slice(0, limit).map((m) => toRecommendedMovie(m, null)) };
}

/**
 * Recommandations personnalisées ; tendances si aucun signal (ou utilisateur non connecté).
 * Avec listId : seuls les films de cette liste servent de signaux (droits de lecture vérifiés : 403/404).
 */
export async function getPersonalRecommendations(userId: string | null, limit: number, listId?: string): Promise<RecommendationsResponse> {
  let signalMovies: SignalMovie[];
  let alreadySeen: number[] = [];
  if (listId) {
    const list = await getList(listId, userId);
    signalMovies = list.movies;
  } else {
    if (!userId) return trending(limit);
    ({ movies: signalMovies, alreadySeen } = await getUserSignalMovies(userId));
  }

  const signals = buildSignals(signalMovies, alreadySeen);
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
