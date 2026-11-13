import Link from "next/link";
import { getViewer } from "@/modules/reviews/http";
import { getMyRating, getMyReview, getRatingSummary, getTopReview, listReviews } from "@/modules/reviews/review.service";
import RatingSummary from "./RatingSummary";
import ReviewComposer from "./ReviewComposer";
import ReviewCard from "./ReviewCard";
import AiReviewSummary from "./AiReviewSummary";

const PREVIEW_COUNT = 3;

// Bloc « Avis des spectateurs » de la fiche film : note moyenne, ma note / mon avis, avis le plus aimé et derniers avis
export default async function MovieReviewsSection({ movieId }: { movieId: string }) {
  const viewer = await getViewer();
  const [summary, myScore, myReview, topReview, latest] = await Promise.all([
    getRatingSummary(movieId),
    viewer ? getMyRating(viewer.id, movieId) : null,
    viewer ? getMyReview(viewer.id, movieId) : null,
    getTopReview(movieId, viewer?.id),
    listReviews({ movieId, sort: "recent", page: 1, limit: PREVIEW_COUNT + 2 }, viewer?.id),
  ]);
  // Pas de doublon : mon avis et l'avis à la une sont déjà affichés
  const others = latest.reviews.filter((r) => r.id !== topReview?.id && r.id !== myReview?.id).slice(0, PREVIEW_COUNT);
  const cardProps = { isLoggedIn: !!viewer, isAdmin: viewer?.isAdmin };

  return (
    <section id="avis" className="mt-10 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-2xl font-bold">Avis des spectateurs</h2>
        {latest.total > 0 && (
          <Link href={`/movies/${movieId}/reviews`} className="text-sm text-blue-400 hover:underline">
            Voir les {latest.total} avis →
          </Link>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RatingSummary summary={summary} />
        <ReviewComposer movieId={movieId} myScore={myScore} hasReview={!!myReview} isLoggedIn={!!viewer} />
      </div>

      {latest.total >= 2 && <AiReviewSummary movieId={movieId} />}

      {myReview && <ReviewCard key={`${myReview.id}-${myReview.content}`} review={myReview} {...cardProps} />}
      {topReview && topReview.id !== myReview?.id && <ReviewCard review={topReview} highlight {...cardProps} />}

      {others.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Derniers avis</h3>
          {others.map((r) => (
            <ReviewCard key={r.id} review={r} {...cardProps} />
          ))}
        </div>
      )}

      {latest.total === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-slate-400">
          Aucun avis pour l&apos;instant. Soyez le premier à partager le vôtre !
        </p>
      ) : (
        <Link
          href={`/movies/${movieId}/reviews`}
          className="block rounded-2xl border border-slate-800 py-3 text-center text-sm font-medium text-blue-400 transition hover:border-blue-500"
        >
          Voir tous les avis ({latest.total})
        </Link>
      )}
    </section>
  );
}
