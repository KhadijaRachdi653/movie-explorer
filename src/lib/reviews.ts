import dbConnect from "@/lib/mongodb";
import Rating from "@/models/Rating";
import Review from "@/models/Review";

export type ReviewSort = "date_desc" | "date_asc" | "rating_desc" | "rating_asc";

export async function getRatingStats(movieId: number) {
  await dbConnect();
  const [stats] = await Rating.aggregate([
    { $match: { movieId } },
    { $group: { _id: "$movieId", average: { $avg: "$score" }, count: { $sum: 1 } } },
  ]);
  return {
    average: stats ? Math.round(stats.average * 10) / 10 : 0,
    count: stats?.count ?? 0,
  };
}

export async function getMyRating(userId: string, movieId: number) {
  await dbConnect();
  const r = await Rating.findOne({ userId, movieId }).lean<{ score: number }>();
  return r?.score ?? 0;
}

export async function getReviews(movieId: number, sort: ReviewSort = "date_desc") {
  await dbConnect();
  const reviews = await Review.find({ movieId }).populate("userId", "name").lean<any[]>();
  const ratings = await Rating.find({ movieId }).lean<any[]>();
  const scoreByUser = new Map(ratings.map((r) => [r.userId.toString(), r.score]));

  const items = reviews.map((r) => ({
    id: r._id.toString(),
    userId: r.userId?._id?.toString() ?? "",
    userName: r.userId?.name ?? "Utilisateur supprimé",
    content: r.content as string,
    score: scoreByUser.get(r.userId?._id?.toString()) ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  items.sort((a, b) => {
    switch (sort) {
      case "date_asc": return a.createdAt.localeCompare(b.createdAt);
      case "rating_desc": return (b.score ?? 0) - (a.score ?? 0);
      case "rating_asc": return (a.score ?? 0) - (b.score ?? 0);
      default: return b.createdAt.localeCompare(a.createdAt);
    }
  });
  return items;
}

export async function getUserRatings(userId: string) {
  await dbConnect();
  const rows = await Rating.find({ userId }).sort({ updatedAt: -1 }).lean<any[]>();
  return rows.map((r) => ({
    movieId: r.movieId as number,
    score: r.score as number,
    updatedAt: r.updatedAt.toISOString(),
  }));
}