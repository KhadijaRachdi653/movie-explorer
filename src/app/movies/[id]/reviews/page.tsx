import { auth } from "@/lib/auth";
import { getRatingStats, getMyRating, getReviews, type ReviewSort } from "@/lib/reviews";
import RatingStars from "@/components/reviews/RatingStars";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewActions from "@/components/reviews/ReviewActions";
import Link from "next/link";

export default async function ReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: ReviewSort }>;
}) {
  const { id } = await params;
  const { sort = "date_desc" } = await searchParams;
  const movieId = Number(id);

  const session = await auth();
  const [stats, reviews, myScore] = await Promise.all([
    getRatingStats(movieId),
    getReviews(movieId, sort),
    session?.user?.id ? getMyRating(session.user.id, movieId) : Promise.resolve(0),
  ]);

  const myReview = reviews.find((r) => r.userId === session?.user?.id);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold">Avis du film #{movieId}</h1>
      <p>★ {stats.average} / 5 ({stats.count} note{stats.count > 1 ? "s" : ""})</p>

      {session?.user ? (
        <>
          <RatingStars movieId={movieId} initialScore={myScore} />
          <ReviewForm key={myReview?.id ?? "new"} movieId={movieId} initialContent={myReview?.content ?? ""} />
        </>
      ) : (
        <p><Link href="/login" className="underline">Connectez-vous</Link> pour noter et commenter.</p>
      )}

      <div className="my-4 flex gap-3 text-sm">
        <Link href="?sort=date_desc">Plus récents</Link>
        <Link href="?sort=date_asc">Plus anciens</Link>
        <Link href="?sort=rating_desc">Meilleures notes</Link>
        <Link href="?sort=rating_asc">Notes les plus basses</Link>
      </div>

      <ul className="flex flex-col gap-3">
        {reviews.length === 0 && <li>Aucun avis pour le moment.</li>}
        {reviews.map((r) => (
          <li key={r.id} className="rounded border p-3">
            <strong>{r.userName}</strong> {r.score && <span>★ {r.score}/5</span>}
            <p>{r.content}</p>
            <small>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</small>
            {session?.user && <ReviewActions movieId={movieId} reviewId={r.id} isOwner={r.userId === session.user.id} />}
          </li>
        ))}
      </ul>
    </main>
  );
}
