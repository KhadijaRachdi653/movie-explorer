import dbConnect from "@/lib/mongodb";
import Rating from "@/models/Rating";
import Review from "@/models/Review";

export type ReviewSort = "date_desc" | "date_asc" | "rating_desc" | "rating_asc";
export type Star = 1 | 2 | 3 | 4 | 5;
export type Distribution = Record<Star, number>;

type Id = { toString(): string };
type ReviewDoc = {
  _id: Id;
  userId: { _id: Id; name?: string } | null;
  content: string;
  createdAt: Date;
};
type RatingDoc = { userId: Id; score: number };
type UserRatingDoc = { movieId: number; score: number; updatedAt: Date };

// Average, count and per-score distribution for one movie.
// Other modules (catalogue, search, recommendations) can import this.
export async function getRatingStats(movieId: number) {
  await dbConnect();
  const rows = await Rating.aggregate<{ _id: number; n: number }>([
    { $match: { movieId } },
    { $group: { _id: "$score", n: { $sum: 1 } } },
  ]);

  const distribution: Distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0;
  let sum = 0;
  for (const r of rows) {
    if (r._id >= 1 && r._id <= 5) {
      distribution[r._id as Star] = r.n;
      count += r.n;
      sum += r._id * r.n;
    }
  }
  return {
    average: count ? Math.round((sum / count) * 10) / 10 : 0,
    count,
    distribution,
  };
}

export async function getMyRating(userId: string, movieId: number) {
  await dbConnect();
  const r = await Rating.findOne({ userId, movieId }).lean<{ score: number }>();
  return r?.score ?? 0;
}

export async function getReviews(movieId: number, sort: ReviewSort = "date_desc") {
  await dbConnect();
  const reviews = await Review.find({ movieId }).populate("userId", "name").lean<ReviewDoc[]>();
  const ratings = await Rating.find({ movieId }).lean<RatingDoc[]>();
  const scoreByUser = new Map<string, number>(ratings.map((r) => [r.userId.toString(), r.score]));

  const items = reviews.map((r) => ({
    id: r._id.toString() as string,
    userId: (r.userId?._id?.toString() ?? "") as string,
    userName: (r.userId?.name ?? "Utilisateur supprimé") as string,
    content: r.content as string,
    score: (scoreByUser.get(r.userId?._id?.toString() ?? "") ?? null) as number | null,
    createdAt: r.createdAt.toISOString() as string,
  }));

  items.sort((a, b) => {
    switch (sort) {
      case "date_asc":
        return a.createdAt.localeCompare(b.createdAt);
      case "rating_desc":
        return (b.score ?? 0) - (a.score ?? 0);
      case "rating_asc":
        return (a.score ?? 0) - (b.score ?? 0);
      default:
        return b.createdAt.localeCompare(a.createdAt);
    }
  });
  return items;
}

export async function getUserRatings(userId: string) {
  await dbConnect();
  const rows = await Rating.find({ userId }).sort({ updatedAt: -1 }).lean<UserRatingDoc[]>();
  return rows.map((r) => ({
    movieId: r.movieId as number,
    score: r.score as number,
    updatedAt: r.updatedAt.toISOString() as string,
  }));
}