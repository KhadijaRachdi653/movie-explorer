import { Types, type PipelineStage } from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Movie, { type MovieDoc } from "@/modules/movies/movie.model";
import { ApiError } from "@/modules/discovery/http";
import { Rating, Review, ReviewReport, type RatingDoc, type ReviewDoc } from "./review.model";
import type { CreateReviewInput, ListReviewsInput, RatingInput, ReviewSort, UpdateReviewInput } from "./review.schema";

// ---------- Formats renvoyés au front ----------

export interface RatingSummary {
  movieId: string;
  average: number; // 0 si aucune note
  count: number;
  distribution: [number, number, number, number, number]; // nombre de notes 1★ … 5★
}

export interface ReviewDto {
  id: string;
  movieId: string;
  content: string;
  spoiler: boolean;
  score: number | null; // note donnée par l'auteur au même film
  likeCount: number;
  likedByMe: boolean;
  isMine: boolean;
  edited: boolean;
  author: { id: string; name: string; avatar: string };
  createdAt: string;
}

export interface ReviewPage {
  reviews: ReviewDto[];
  page: number;
  totalPages: number;
  total: number;
}

type ReviewRow = ReviewDoc & {
  likeCount: number;
  score: number | null;
  author: { _id: Types.ObjectId; name: string; avatar?: string } | null;
};

function toReviewDto(row: ReviewRow, viewerId?: string): ReviewDto {
  const authorId = row.userId.toString();
  return {
    id: row._id.toString(),
    movieId: String(row.movieId),
    content: row.content,
    spoiler: row.spoiler ?? false,
    score: row.score ?? null,
    likeCount: row.likeCount,
    likedByMe: !!viewerId && row.likes.some((u) => u.toString() === viewerId),
    isMine: authorId === viewerId,
    edited: row.updatedAt.getTime() - row.createdAt.getTime() > 1000,
    author: { id: authorId, name: row.author?.name ?? "Utilisateur supprimé", avatar: row.author?.avatar ?? "" },
    createdAt: row.createdAt.toISOString(),
  };
}

const SORT_STAGE: Record<ReviewSort, Record<string, 1 | -1>> = {
  recent: { createdAt: -1 },
  likes: { likeCount: -1, createdAt: -1 },
  highest: { sortScore: -1, createdAt: -1 },
  lowest: { sortScore: 1, createdAt: -1 },
};

// Ajoute à chaque avis : nombre de likes, note de l'auteur et profil public de l'auteur
function enrichStages(): PipelineStage.FacetPipelineStage[] {
  return [
    { $addFields: { likeCount: { $size: "$likes" } } },
    {
      $lookup: {
        from: Rating.collection.name,
        let: { u: "$userId", m: "$movieId" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$userId", "$$u"] }, { $eq: ["$movieId", "$$m"] }] } } },
          { $project: { score: 1 } },
        ],
        as: "rating",
      },
    },
    { $addFields: { score: { $ifNull: [{ $first: "$rating.score" }, null] } } },
  ];
}

function authorStages(): PipelineStage.FacetPipelineStage[] {
  return [
    {
      $lookup: {
        from: User.collection.name,
        localField: "userId",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1, avatar: 1 } }],
        as: "author",
      },
    },
    { $addFields: { author: { $first: "$author" } } },
    { $project: { rating: 0 } },
  ];
}

// Le film doit exister dans le catalogue (Module 2) avant d'être noté ou commenté
async function assertMovieExists(movieId: string): Promise<void> {
  if (!(await Movie.exists({ _id: movieId }))) throw new ApiError(404, "Film introuvable.");
}

const isDuplicateKey = (err: unknown) =>
  typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;

// ---------- Notes (Rating) ----------

export async function getRatingSummary(movieId: string): Promise<RatingSummary> {
  await dbConnect();
  const groups = await Rating.aggregate<{ _id: number; n: number }>([
    { $match: { movieId } },
    { $group: { _id: "$score", n: { $sum: 1 } } },
  ]);
  const distribution: RatingSummary["distribution"] = [0, 0, 0, 0, 0];
  for (const g of groups) if (g._id >= 1 && g._id <= 5) distribution[g._id - 1] = g.n;
  const count = distribution.reduce((a, b) => a + b, 0);
  const total = distribution.reduce((sum, n, i) => sum + n * (i + 1), 0);
  return { movieId, average: count ? Math.round((total / count) * 10) / 10 : 0, count, distribution };
}

// Interface pour les autres modules (catalogue, recherche, recommandations) : moyenne et nombre de notes par film
export async function getRatingSummaries(movieIds: string[]): Promise<Record<string, { average: number; count: number }>> {
  await dbConnect();
  const rows = await Rating.aggregate<{ _id: string; average: number; count: number }>([
    { $match: { movieId: { $in: movieIds } } },
    { $group: { _id: "$movieId", average: { $avg: "$score" }, count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, { average: Math.round(r.average * 10) / 10, count: r.count }]));
}

// Films les mieux notés par la communauté (au moins `minVotes` notes)
export async function getTopRatedMovieIds(limit = 5, minVotes = 1) {
  await dbConnect();
  return Rating.aggregate<{ _id: string; average: number; count: number }>([
    { $group: { _id: "$movieId", average: { $avg: "$score" }, count: { $sum: 1 } } },
    { $match: { count: { $gte: minVotes } } },
    { $sort: { average: -1, count: -1 } },
    { $limit: limit },
  ]);
}

export async function getMyRating(userId: string, movieId: string): Promise<number | null> {
  await dbConnect();
  const doc = await Rating.findOne({ userId, movieId }).lean<RatingDoc>();
  return doc?.score ?? null;
}

// C / U — une note par utilisateur et par film : la renoter remplace l'ancienne note
export async function upsertRating(userId: string, input: RatingInput): Promise<RatingSummary> {
  await dbConnect();
  await assertMovieExists(input.movieId);
  await Rating.findOneAndUpdate(
    { userId, movieId: input.movieId },
    { $set: { score: input.score } },
    { upsert: true, runValidators: true }
  );
  return getRatingSummary(input.movieId);
}

// D
export async function deleteRating(userId: string, movieId: string): Promise<RatingSummary> {
  await dbConnect();
  const res = await Rating.deleteOne({ userId, movieId });
  if (res.deletedCount === 0) throw new ApiError(404, "Vous n'avez pas noté ce film.");
  return getRatingSummary(movieId);
}

// ---------- Commentaires (Review) ----------

// R — avis d'un film, triés et paginés
export async function listReviews(input: ListReviewsInput, viewerId?: string): Promise<ReviewPage> {
  await dbConnect();
  const { movieId, sort, page, limit } = input;
  const [result] = await Review.aggregate<{ items: ReviewRow[]; total: { n: number }[] }>([
    { $match: { movieId } },
    ...enrichStages(),
    // Sans note, l'avis est classé en dernier quel que soit le sens du tri
    { $addFields: { sortScore: { $ifNull: ["$score", sort === "lowest" ? 6 : 0] } } },
    {
      $facet: {
        items: [{ $sort: SORT_STAGE[sort] }, { $skip: (page - 1) * limit }, { $limit: limit }, ...authorStages()],
        total: [{ $count: "n" }],
      },
    },
  ]);
  const total = result.total[0]?.n ?? 0;
  return {
    reviews: result.items.map((r) => toReviewDto(r, viewerId)),
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    total,
  };
}

// L'avis le plus aimé (au moins un like), mis en avant sur la fiche du film
export async function getTopReview(movieId: string, viewerId?: string): Promise<ReviewDto | null> {
  const { reviews } = await listReviews({ movieId, sort: "likes", page: 1, limit: 1 }, viewerId);
  return reviews[0]?.likeCount ? reviews[0] : null;
}

export async function getMyReview(userId: string, movieId: string): Promise<ReviewDto | null> {
  await dbConnect();
  const [row] = await Review.aggregate<ReviewRow>([
    { $match: { userId: new Types.ObjectId(userId), movieId } },
    ...enrichStages(),
    ...authorStages(),
  ]);
  return row ? toReviewDto(row, userId) : null;
}

async function getReviewDto(id: string, viewerId: string): Promise<ReviewDto> {
  const [row] = await Review.aggregate<ReviewRow>([
    { $match: { _id: new Types.ObjectId(id) } },
    ...enrichStages(),
    ...authorStages(),
  ]);
  if (!row) throw new ApiError(404, "Avis introuvable.");
  return toReviewDto(row, viewerId);
}

// C — un seul avis par utilisateur et par film
export async function createReview(userId: string, input: CreateReviewInput): Promise<ReviewDto> {
  await dbConnect();
  await assertMovieExists(input.movieId);
  if (await Review.exists({ userId, movieId: input.movieId })) {
    throw new ApiError(409, "Vous avez déjà publié un avis sur ce film : modifiez-le plutôt.");
  }
  try {
    const doc = await Review.create({ userId, ...input });
    return getReviewDto(doc._id.toString(), userId);
  } catch (err) {
    if (isDuplicateKey(err)) throw new ApiError(409, "Vous avez déjà publié un avis sur ce film : modifiez-le plutôt.");
    throw err;
  }
}

// U — seul l'auteur modifie son avis
export async function updateReview(id: string, userId: string, input: UpdateReviewInput): Promise<ReviewDto> {
  await dbConnect();
  const doc = await Review.findOneAndUpdate({ _id: id, userId }, { $set: input }, { runValidators: true });
  if (!doc) throw new ApiError(404, "Avis introuvable.");
  return getReviewDto(id, userId);
}

// D — l'auteur ou un administrateur ; les signalements liés sont supprimés avec l'avis
export async function deleteReview(id: string, userId: string, isAdmin = false): Promise<void> {
  await dbConnect();
  const doc = await Review.findOneAndDelete(isAdmin ? { _id: id } : { _id: id, userId });
  if (!doc) throw new ApiError(404, "Avis introuvable.");
  await ReviewReport.deleteMany({ reviewId: doc._id });
}

// Aimer / ne plus aimer un avis (pas le sien)
export async function toggleLike(id: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
  await dbConnect();
  const review = await Review.findById(id).lean<ReviewDoc>();
  if (!review) throw new ApiError(404, "Avis introuvable.");
  if (review.userId.toString() === userId) throw new ApiError(400, "Vous ne pouvez pas aimer votre propre avis.");
  const liked = review.likes.some((u) => u.toString() === userId);
  const updated = await Review.findByIdAndUpdate(
    id,
    liked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } },
    { new: true }
  ).lean<ReviewDoc>();
  return { liked: !liked, likeCount: updated?.likes.length ?? 0 };
}

// Signaler un avis inapproprié (une fois par utilisateur, pas le sien)
export async function reportReview(id: string, userId: string, reason: string): Promise<void> {
  await dbConnect();
  const review = await Review.findById(id).lean<ReviewDoc>();
  if (!review) throw new ApiError(404, "Avis introuvable.");
  if (review.userId.toString() === userId) throw new ApiError(400, "Vous ne pouvez pas signaler votre propre avis.");
  try {
    await ReviewReport.create({ reviewId: id, reporterUserId: userId, reason });
  } catch (err) {
    if (isDuplicateKey(err)) throw new ApiError(409, "Vous avez déjà signalé cet avis.");
    throw err;
  }
}

// ---------- Espace personnel (/profile/ratings) ----------

export interface MyActivityItem {
  movie: { id: string; title: string; posterUrl: string; year: number } | null;
  movieId: string;
  score: number | null;
  review: { id: string; content: string; spoiler: boolean; likeCount: number } | null;
  updatedAt: string;
}

export async function listMyActivity(userId: string): Promise<MyActivityItem[]> {
  await dbConnect();
  const [ratings, reviews] = await Promise.all([
    Rating.find({ userId }).lean<RatingDoc[]>(),
    Review.find({ userId }).lean<ReviewDoc[]>(),
  ]);
  const byMovie = new Map<string, MyActivityItem>();
  const entry = (movieId: string, date: Date) => {
    const item = byMovie.get(movieId) ?? { movie: null, movieId, score: null, review: null, updatedAt: date.toISOString() };
    if (date.toISOString() > item.updatedAt) item.updatedAt = date.toISOString();
    byMovie.set(movieId, item);
    return item;
  };
  for (const r of ratings) entry(String(r.movieId), r.updatedAt).score = r.score;
  for (const r of reviews) {
    entry(String(r.movieId), r.updatedAt).review = {
      id: r._id.toString(),
      content: r.content,
      spoiler: r.spoiler ?? false,
      likeCount: r.likes.length,
    };
  }
  const movieIds = [...byMovie.keys()].filter((id) => Types.ObjectId.isValid(id));
  const movies = await Movie.find({ _id: { $in: movieIds } }).lean<MovieDoc[]>();
  for (const m of movies) {
    const item = byMovie.get(m._id.toString());
    if (item) item.movie = { id: m._id.toString(), title: m.title, posterUrl: m.posterUrl ?? "", year: m.year ?? 0 };
  }
  return [...byMovie.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
