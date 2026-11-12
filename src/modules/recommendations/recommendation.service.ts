import mongoose, { Types, isValidObjectId } from "mongoose";
import dbConnect from "@/lib/mongodb";
import CustomList, { type CustomListDoc } from "./customList.model";
import { getList } from "./customList.service";
import {
  getCatalogMap,
  getCatalogMovies,
  MIN_COMMUNITY_VOTES,
  type CatalogMovie,
} from "./catalogue";
import {
  buildSignals,
  rankCandidates,
  similarTo,
  toRecommendedMovie,
  type CandidateGroup,
  type SignalMovie,
} from "./ranking";
import type { RecommendationsResponse } from "./types";
import { ApiError } from "./errors";

interface UserFilm {
  movieId: string;
  title?: string;
  addedAt: Date;
}

/**
 * Films « signaux » de l'utilisateur, tous identifiés par leur id du catalogue (Module 2) :
 * - les films de ses listes personnalisées (Module 6) ;
 * - ses favoris (Module 4, collection `collectionItems`, `favorite: true`) ;
 * - les films qu'il a bien notés (Module 3, collection `ratings`, note ≥ 4/5).
 * Favoris et notes sont lus directement en base pour ne pas dépendre du code des autres modules.
 */
async function getUserSignalMovies(
  userId: string,
): Promise<{ movies: SignalMovie[]; alreadySeen: string[] }> {
  await dbConnect();
  const lists = await CustomList.find({ userId }, "movies").lean<
    Pick<CustomListDoc, "movies">[]
  >();
  const fromLists: UserFilm[] = lists.flatMap((l) =>
    l.movies.map((m) => ({ movieId: m.movieId, addedAt: m.addedAt })),
  );
  const [favorites, rated] = await Promise.all([
    getFavoriteFilms(userId),
    getRatedFilms(userId),
  ]);
  // titre vide : la raison devient « D'après les films que vous avez bien notés »
  const films = [
    ...fromLists,
    ...favorites,
    ...rated.liked.map((f) => ({ ...f, title: "" })),
  ];
  // Films déjà notés (même mal) : déjà vus, donc jamais recommandés
  return {
    movies: await withCatalogDetails(films),
    alreadySeen: rated.ratedIds,
  };
}

// Complète les films de l'utilisateur avec leurs genres et réalisateur (films retirés du catalogue ignorés)
async function withCatalogDetails(films: UserFilm[]): Promise<SignalMovie[]> {
  const catalogue = await getCatalogMap(films.map((f) => f.movieId));
  return films.flatMap((f) => {
    const m = catalogue.get(f.movieId);
    return m
      ? [
          {
            movieId: m.movieId,
            title: f.title ?? m.title,
            genres: m.genres,
            director: m.director,
            addedAt: f.addedAt,
          },
        ]
      : [];
  });
}

export const RATING_LIKED_MIN = 4; // note sur 5 à partir de laquelle un film est « aimé »

/** Notes de l'utilisateur : films aimés (signaux) et tous les films notés (déjà vus, à exclure). */
async function getRatedFilms(
  userId: string,
): Promise<{ liked: UserFilm[]; ratedIds: string[] }> {
  const db = mongoose.connection.db;
  if (!db || !Types.ObjectId.isValid(userId))
    return { liked: [], ratedIds: [] };
  try {
    const ratings = await db
      .collection<{ movieId?: unknown; score?: number; updatedAt?: Date }>(
        "ratings",
      )
      .find(
        { userId: new Types.ObjectId(userId) },
        { projection: { movieId: 1, score: 1, updatedAt: 1 } },
      )
      .sort({ updatedAt: -1 })
      .limit(200)
      .toArray();
    const valid = ratings.flatMap((r) =>
      typeof r.movieId === "string" &&
      isValidObjectId(r.movieId) &&
      typeof r.score === "number"
        ? [
            {
              movieId: r.movieId,
              score: r.score,
              addedAt: r.updatedAt ?? new Date(0),
            },
          ]
        : [],
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

async function getFavoriteFilms(userId: string): Promise<UserFilm[]> {
  const db = mongoose.connection.db;
  if (!db || !Types.ObjectId.isValid(userId)) return [];
  try {
    const items = await db
      .collection<{
        movie?: { movieId?: unknown; title?: string };
        updatedAt?: Date;
      }>("collectionItems")
      .find(
        { userId: new Types.ObjectId(userId), favorite: true },
        { projection: { movie: 1, updatedAt: 1 } },
      )
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();
    return items.flatMap((i) => {
      const id = i.movie?.movieId;
      return typeof id === "string" && isValidObjectId(id)
        ? [
            {
              movieId: id,
              title: i.movie?.title,
              addedAt: i.updatedAt ?? new Date(0),
            },
          ]
        : [];
    });
  } catch (err) {
    console.error("Lecture des favoris impossible :", err);
    return []; // les favoris améliorent les recommandations mais ne doivent jamais les bloquer
  }
}

/** Tendances : les films les mieux notés (spectateurs, sinon catalogue). */
export async function getTrending(
  limit: number,
): Promise<RecommendationsResponse> {
  return trending(await getCatalogMovies(), limit);
}

function trending(
  catalogue: CatalogMovie[],
  limit: number,
  exclude = new Set<string>(),
): RecommendationsResponse {
  const results = catalogue
    .filter((m) => !exclude.has(m.movieId))
    .sort((a, b) => b.rating - a.rating || b.communityVotes - a.communityVotes)
    .slice(0, limit)
    .map((m) =>
      toRecommendedMovie(
        m,
        m.communityVotes >= MIN_COMMUNITY_VOTES
          ? "Plébiscité par les spectateurs"
          : "Parmi les mieux notés",
      ),
    );
  return { source: "trending", results };
}

/** Films similaires à un film du catalogue (même réalisateur ou genres communs). */
export async function getSimilarMovies(
  movieId: string,
  limit: number,
): Promise<RecommendationsResponse> {
  const catalogue = await getCatalogMovies();
  const seed = catalogue.find((m) => m.movieId === movieId);
  if (!seed) throw new ApiError(404, "Film introuvable dans le catalogue.");
  const signals = buildSignals([{ ...seed, addedAt: new Date() }]);
  const results = rankCandidates(
    [{ seedTitle: seed.title, movies: similarTo(seed, catalogue) }],
    signals,
    limit,
  );
  return {
    source: "similar",
    results: results.map((m) => ({ ...m, reason: null, match: null })),
  };
}

/**
 * Recommandations personnalisées ; tendances si aucun signal (ou utilisateur non connecté).
 * Avec listId : seuls les films de cette liste servent de signaux (droits de lecture vérifiés : 403/404).
 */
export async function getPersonalRecommendations(
  userId: string | null,
  limit: number,
  listId?: string,
): Promise<RecommendationsResponse> {
  const catalogue = await getCatalogMovies();
  let signalMovies: SignalMovie[];
  let alreadySeen: string[] = [];
  if (listId) {
    const list = await getList(listId, userId);
    signalMovies = await withCatalogDetails(
      list.movies.map((m) => ({
        movieId: m.movieId,
        addedAt: new Date(m.addedAt),
      })),
    );
  } else {
    if (!userId) return trending(catalogue, limit);
    ({ movies: signalMovies, alreadySeen } = await getUserSignalMovies(userId));
  }

  const signals = buildSignals(signalMovies, alreadySeen);
  if (signals.seeds.length === 0)
    return trending(catalogue, limit, signals.excludeIds);

  const groups: CandidateGroup[] = signals.seeds.map((s) => ({
    seedTitle: s.title,
    movies: similarTo(s, catalogue),
  }));
  if (signals.topGenres.length > 0) {
    groups.push({
      seedTitle: null,
      movies: catalogue.filter((m) =>
        m.genres.some((g) => signals.topGenres.includes(g)),
      ),
    });
  }

  const results = rankCandidates(groups, signals, limit);
  return results.length > 0
    ? { source: listId ? "list" : "personal", results }
    : trending(catalogue, limit, signals.excludeIds);
}
