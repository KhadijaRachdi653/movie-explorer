import mongoose, { Types, isValidObjectId } from "mongoose";
import dbConnect from "@/lib/mongodb";
import CustomList, { type CustomListDoc } from "./customList.model";
import { getList } from "./customList.service";
import { getCatalogMap, getCatalogMovies, MIN_COMMUNITY_VOTES, type CatalogMovie } from "./catalogue";
import { buildSignals, rankBySpectators, rankCandidates, similarTo, toRecommendedMovie, type CandidateGroup, type SignalMovie } from "./ranking";
import type { RecommendationSources, RecommendationsResponse } from "./types";
import { ApiError } from "./errors";

interface UserFilm {
  movieId: string;
  title?: string;
  addedAt: Date;
}

/**
 * Signaux de l'utilisateur, tirés de chaque partie de l'équipe (identifiants du catalogue, Module 2) :
 * - Module 6 : les films de ses listes personnalisées ;
 * - Module 4 (collection) : favoris et films « À voir » / « En cours » = signaux ; films « Vu » = exclus ;
 * - Module 3 (notes) : films notés 4 ou 5 sur 5 = signaux ; tout film déjà noté = exclu ;
 * - Module 5 (recherches sauvegardées) : leurs genres comptent dans les genres préférés.
 * Les données des autres modules sont lues directement en base pour ne pas dépendre de leur code.
 */
async function getUserSignalMovies(
  userId: string
): Promise<{ movies: SignalMovie[]; alreadySeen: string[]; extraGenres: string[]; basedOn: RecommendationSources }> {
  await dbConnect();
  const lists = await CustomList.find({ userId }, "movies").lean<Pick<CustomListDoc, "movies">[]>();
  const fromLists: UserFilm[] = lists.flatMap((l) => l.movies.map((m) => ({ movieId: m.movieId, addedAt: m.addedAt })));
  const [collection, rated, savedSearchGenres] = await Promise.all([getCollectionFilms(userId), getRatedFilms(userId), getSavedSearchGenres(userId)]);
  // titre vide : la raison devient « D'après les films que vous avez bien notés »
  const films = [...fromLists, ...collection.favorites, ...collection.watchlist, ...rated.liked.map((f) => ({ ...f, title: "" }))];
  return {
    movies: await withCatalogDetails(films),
    // Déjà vus : films notés (même mal) et films marqués « Vu » dans la collection
    alreadySeen: [...rated.ratedIds, ...collection.watchedIds],
    extraGenres: savedSearchGenres,
    basedOn: {
      listFilms: fromLists.length,
      favorites: collection.favorites.length,
      watchlist: collection.watchlist.length,
      watched: collection.watchedIds.length,
      likedRatings: rated.liked.length,
      savedSearchGenres: [...new Set(savedSearchGenres)],
    },
  };
}

// Complète les films de l'utilisateur avec leurs genres et réalisateur (films retirés du catalogue ignorés)
async function withCatalogDetails(films: UserFilm[]): Promise<SignalMovie[]> {
  const catalogue = await getCatalogMap(films.map((f) => f.movieId));
  return films.flatMap((f) => {
    const m = catalogue.get(f.movieId);
    return m ? [{ movieId: m.movieId, title: f.title ?? m.title, genres: m.genres, director: m.director, addedAt: f.addedAt }] : [];
  });
}

export const RATING_LIKED_MIN = 4; // note sur 5 à partir de laquelle un film est « aimé »

/** Notes de l'utilisateur : films aimés (signaux) et tous les films notés (déjà vus, à exclure). */
async function getRatedFilms(userId: string): Promise<{ liked: UserFilm[]; ratedIds: string[] }> {
  const db = mongoose.connection.db;
  if (!db || !Types.ObjectId.isValid(userId)) return { liked: [], ratedIds: [] };
  try {
    const ratings = await db
      .collection<{ movieId?: unknown; score?: number; updatedAt?: Date }>("ratings")
      .find({ userId: new Types.ObjectId(userId) }, { projection: { movieId: 1, score: 1, updatedAt: 1 } })
      .sort({ updatedAt: -1 })
      .limit(200)
      .toArray();
    const valid = ratings.flatMap((r) =>
      typeof r.movieId === "string" && isValidObjectId(r.movieId) && typeof r.score === "number"
        ? [{ movieId: r.movieId, score: r.score, addedAt: r.updatedAt ?? new Date(0) }]
        : []
    );
    return {
      liked: valid.filter((r) => r.score >= RATING_LIKED_MIN),
      ratedIds: valid.map((r) => r.movieId),
    };
  } catch (err) {
    console.error("Lecture des notes impossible :", err);
    return { liked: [], ratedIds: [] };
  }
}

type CollectionDocLite = { movie?: { movieId?: unknown; title?: string }; favorite?: boolean; status?: string; updatedAt?: Date };

async function getCollectionFilms(userId: string): Promise<{ favorites: UserFilm[]; watchlist: UserFilm[]; watchedIds: string[] }> {
  const empty = { favorites: [], watchlist: [], watchedIds: [] };
  const db = mongoose.connection.db;
  if (!db || !Types.ObjectId.isValid(userId)) return empty;
  try {
    const items = await db
      .collection<CollectionDocLite>("collectionItems")
      .find({ userId: new Types.ObjectId(userId) }, { projection: { movie: 1, favorite: 1, status: 1, updatedAt: 1 } })
      .sort({ updatedAt: -1 })
      .limit(200)
      .toArray();
    const valid = items.flatMap((i) => {
      const id = i.movie?.movieId;
      return typeof id === "string" && isValidObjectId(id) ? [{ item: i, film: { movieId: id, title: i.movie?.title, addedAt: i.updatedAt ?? new Date(0) } }] : [];
    });
    return {
      favorites: valid.filter((v) => v.item.favorite).map((v) => v.film),
      watchlist: valid.filter((v) => !v.item.favorite && (v.item.status === "planned" || v.item.status === "watching")).map((v) => v.film),
      watchedIds: valid.filter((v) => v.item.status === "watched").map((v) => v.film.movieId),
    };
  } catch (err) {
    console.error("Lecture de la collection impossible :", err);
    return empty; // la collection améliore les recommandations mais ne doit jamais les bloquer
  }
}

// Recherches sauvegardées (Module 5) : genres choisis par l'utilisateur
async function getSavedSearchGenres(userId: string): Promise<string[]> {
  const db = mongoose.connection.db;
  if (!db || !Types.ObjectId.isValid(userId)) return [];
  try {
    const searches = await db
      .collection<{ filters?: { genre?: string } }>("savedSearches")
      .find({ userId: { $in: [new Types.ObjectId(userId), userId] } }, { projection: { "filters.genre": 1 } })
      .limit(50)
      .toArray();
    return searches.map((s) => s.filters?.genre?.trim()).filter((g): g is string => Boolean(g));
  } catch (err) {
    console.error("Lecture des recherches sauvegardées impossible :", err);
    return [];
  }
}

/** Tendances : les films les mieux notés (spectateurs, sinon catalogue). */
export async function getTrending(limit: number): Promise<RecommendationsResponse> {
  return trending(await getCatalogMovies(), limit);
}

function trending(catalogue: CatalogMovie[], limit: number, exclude = new Set<string>()): RecommendationsResponse {
  // Classement par les notes des spectateurs (Module 3), complété par la note du catalogue (Module 2)
  const results = rankBySpectators(catalogue.filter((m) => !exclude.has(m.movieId)), MIN_COMMUNITY_VOTES)
    .slice(0, limit)
    .map(({ movie: m, score }) =>
      toRecommendedMovie(
        m,
        score !== null
          ? `Noté ${(m.communityAverage as number).toFixed(1).replace(".", ",")}/5 par ${m.communityVotes} membre${m.communityVotes > 1 ? "s" : ""}`
          : "Parmi les mieux notés du catalogue"
      )
    );
  return { source: "trending", results };
}

/** Films similaires à un film du catalogue (même réalisateur ou genres communs). */
export async function getSimilarMovies(movieId: string, limit: number): Promise<RecommendationsResponse> {
  const catalogue = await getCatalogMovies();
  const seed = catalogue.find((m) => m.movieId === movieId);
  if (!seed) throw new ApiError(404, "Film introuvable dans le catalogue.");
  const signals = buildSignals([{ ...seed, addedAt: new Date() }]);
  const results = rankCandidates([{ seedTitle: seed.title, movies: similarTo(seed, catalogue) }], signals, limit);
  return { source: "similar", results: results.map((m) => ({ ...m, reason: null, match: null })) };
}

/**
 * Recommandations personnalisées ; tendances si aucun signal (ou utilisateur non connecté).
 * Avec listId : seuls les films de cette liste servent de signaux (droits de lecture vérifiés : 403/404).
 */
export async function getPersonalRecommendations(userId: string | null, limit: number, listId?: string): Promise<RecommendationsResponse> {
  const catalogue = await getCatalogMovies();
  let signalMovies: SignalMovie[];
  let alreadySeen: string[] = [];
  let extraGenres: string[] = [];
  let basedOn: RecommendationSources | undefined;
  if (listId) {
    const list = await getList(listId, userId);
    signalMovies = await withCatalogDetails(list.movies.map((m) => ({ movieId: m.movieId, addedAt: new Date(m.addedAt) })));
  } else {
    if (!userId) return trending(catalogue, limit);
    ({ movies: signalMovies, alreadySeen, extraGenres, basedOn } = await getUserSignalMovies(userId));
  }

  const signals = buildSignals(signalMovies, alreadySeen, extraGenres);
  if (signals.seeds.length === 0) return { ...trending(catalogue, limit, signals.excludeIds), basedOn };

  const groups: CandidateGroup[] = signals.seeds.map((s) => ({ seedTitle: s.title, movies: similarTo(s, catalogue) }));
  if (signals.topGenres.length > 0) {
    groups.push({ seedTitle: null, movies: catalogue.filter((m) => m.genres.some((g) => signals.topGenres.includes(g))) });
  }

  const results = rankCandidates(groups, signals, limit);
  return results.length > 0
    ? { source: listId ? "list" : "personal", results, basedOn }
    : { ...trending(catalogue, limit, signals.excludeIds), basedOn };
}
