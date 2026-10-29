import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRatingStats, getMyRating, getReviews, type ReviewSort } from "@/lib/reviews";
import RatingSummary from "@/components/reviews/RatingSummary";
import RatingStars from "@/components/reviews/RatingStars";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewCard from "@/components/reviews/ReviewCard";

export const metadata = { title: "Avis et notes" };

const SORTS: { value: ReviewSort; label: string }[] = [
  { value: "date_desc", label: "Récents" },
  { value: "date_asc", label: "Anciens" },
  { value: "rating_desc", label: "Mieux notés" },
  { value: "rating_asc", label: "Moins bien notés" },
];

const card = "rounded-2xl border border-slate-800 bg-slate-900 p-5";

export default async function ReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { id } = await params;
  const { sort: rawSort } = await searchParams;

  const movieId = Number(id);
  if (!Number.isInteger(movieId) || movieId <= 0) notFound();

  const sort = SORTS.find((s) => s.value === rawSort)?.value ?? "date_desc";

  const session = await auth();
  const userId = session?.user?.id;

  const [stats, reviews, myScore] = await Promise.all([
    getRatingStats(movieId),
    getReviews(movieId, sort),
    userId ? getMyRating(userId, movieId) : Promise.resolve(0),
  ]);
  const myReview = reviews.find((r) => r.userId === userId);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between text-sm">
        {/* TODO: point to /movies/[id] once Movie Management has the page */}
        <Link href="/" className="text-slate-400 hover:text-slate-100">
          ← Accueil
        </Link>
        {userId && (
          <Link href="/profile/ratings" className="text-slate-400 hover:text-slate-100">
            Mes notes
          </Link>
        )}
      </nav>

      <header>
        <h1 className="text-3xl font-bold">Avis et notes</h1>
        {/* TODO: replace with the movie title from Movie Management */}
        <p className="mt-1 text-slate-400">Film n° {movieId}</p>
      </header>

      <div className="mt-8 grid gap-6 md:grid-cols-[20rem_1fr] md:items-start">
        <aside className="space-y-4 md:sticky md:top-6">
          <section className={card} aria-label="Note moyenne">
            <RatingSummary average={stats.average} count={stats.count} distribution={stats.distribution} />
          </section>

          <section className={card} aria-label="Votre note">
            <h2 className="mb-3 text-sm font-medium text-slate-200">Votre note</h2>
            {userId ? (
              <RatingStars movieId={movieId} initialScore={myScore} />
            ) : (
              <p className="text-sm text-slate-400">
                <Link href="/login" className="font-medium text-blue-400 underline underline-offset-2 hover:text-blue-300">
                  Connectez-vous
                </Link>{" "}
                pour noter ce film.
              </p>
            )}
          </section>
        </aside>

        <div className="space-y-6">
          <section className={card} aria-label="Votre commentaire">
            {userId ? (
              <ReviewForm key={myReview?.id ?? "new"} movieId={movieId} initialContent={myReview?.content ?? ""} />
            ) : (
              <p className="text-sm text-slate-400">
                <Link href="/login" className="font-medium text-blue-400 underline underline-offset-2 hover:text-blue-300">
                  Connectez-vous
                </Link>{" "}
                pour écrire un commentaire.
              </p>
            )}
          </section>

          <section aria-label="Commentaires">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {reviews.length} commentaire{reviews.length > 1 ? "s" : ""}
              </h2>
              <nav aria-label="Trier les commentaires" className="flex flex-wrap gap-1.5 text-sm">
                {SORTS.map((s) => (
                  <Link
                    key={s.value}
                    href={`?sort=${s.value}`}
                    aria-current={s.value === sort ? "true" : undefined}
                    className={`rounded-full px-3 py-1 transition ${
                      s.value === sort
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </nav>
            </div>

            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">
                <p className="font-medium">Aucun commentaire pour l&apos;instant</p>
                <p className="mt-1 text-sm text-slate-400">Soyez le premier à donner votre avis sur ce film.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} movieId={movieId} currentUserId={userId} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}