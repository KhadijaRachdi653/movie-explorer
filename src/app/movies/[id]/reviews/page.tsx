import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovie } from "@/modules/movies/movie.service";
import { isValidMovieId } from "@/modules/movies/movie.schema";
import { getViewer } from "@/modules/reviews/http";
import {
  getRatingSummary,
  listReviews,
} from "@/modules/reviews/review.service";
import { REVIEW_SORTS, type ReviewSort } from "@/modules/reviews/review.schema";
import RatingSummary from "@/components/reviews/RatingSummary";
import ReviewCard from "@/components/reviews/ReviewCard";
import AiReviewSummary from "@/components/reviews/AiReviewSummary";

export const dynamic = "force-dynamic";
export const metadata = { title: "Avis" };

const SORT_LABELS: Record<ReviewSort, string> = {
  recent: "Plus récents",
  likes: "Plus aimés",
  highest: "Meilleures notes",
  lowest: "Moins bonnes notes",
};
const PAGE_SIZE = 10;

export default async function MovieReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { id } = await params;
  if (!isValidMovieId(id)) notFound();
  const movie = await getMovie(id).catch(() => null);
  if (!movie) notFound();

  const query = await searchParams;
  const sort: ReviewSort = REVIEW_SORTS.includes(query.sort as ReviewSort)
    ? (query.sort as ReviewSort)
    : "recent";
  const page = Math.max(1, Number(query.page) || 1);
  const viewer = await getViewer();
  const [summary, { reviews, totalPages, total }] = await Promise.all([
    getRatingSummary(id),
    listReviews({ movieId: id, sort, page, limit: PAGE_SIZE }, viewer?.id),
  ]);
  const href = (s: ReviewSort, p = 1) =>
    `/movies/${id}/reviews?sort=${s}${p > 1 ? `&page=${p}` : ""}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-4xl p-4">
        <Link href={`/movies/${id}`} className="text-sm text-blue-400">
          ← {movie.title}
        </Link>

        <div className="mt-4 flex items-center gap-4">
          {movie.posterUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="h-24 w-16 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">Avis sur {movie.title}</h1>
            <p className="text-sm text-slate-400">
              {movie.year} · {total} avis
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <RatingSummary summary={summary} />
          {total >= 2 && <AiReviewSummary movieId={id} />}
        </div>

        <nav
          className="mt-6 flex gap-2 overflow-x-auto pb-1"
          aria-label="Trier les avis"
        >
          {REVIEW_SORTS.map((s) => (
            <Link
              key={s}
              href={href(s)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${
                s === sort
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-slate-700 text-slate-300 hover:border-blue-500"
              }`}
            >
              {SORT_LABELS[s]}
            </Link>
          ))}
        </nav>

        <div className="mt-4 space-y-3">
          {reviews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-slate-400">
              Aucun avis pour l&apos;instant.{" "}
              <Link
                href={`/movies/${id}#avis`}
                className="text-blue-400 hover:underline"
              >
                Soyez le premier !
              </Link>
            </p>
          ) : (
            reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                isLoggedIn={!!viewer}
                isAdmin={viewer?.isAdmin}
              />
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            {page > 1 && <Link href={href(sort, page - 1)}>← Précédent</Link>}
            <span>
              Page {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link href={href(sort, page + 1)}>Suivant →</Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
