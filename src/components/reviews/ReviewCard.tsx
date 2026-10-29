import StarDisplay from "./StarDisplay";
import ReviewActions from "./ReviewActions";

export type ReviewItem = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  score: number | null;
  createdAt: string;
};

export default function ReviewCard({
  review,
  movieId,
  currentUserId,
}: {
  review: ReviewItem;
  movieId: number;
  currentUserId?: string;
}) {
  const isOwner = !!currentUserId && review.userId === currentUserId;
  const initial = review.userName.trim().charAt(0).toUpperCase() || "?";
  const date = new Date(review.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article
      className={`rounded-2xl border p-5 ${
        isOwner ? "border-blue-500/40 bg-blue-950/20" : "border-slate-800 bg-slate-900"
      }`}
    >
      <header className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            isOwner ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200"
          }`}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {review.userName}
            {isOwner && (
              <span className="ml-2 rounded-full bg-blue-600/20 px-2 py-0.5 text-xs font-normal text-blue-300">
                Vous
              </span>
            )}
          </p>
          <p className="text-xs text-slate-400">
            <time dateTime={review.createdAt}>{date}</time>
          </p>
        </div>
        {review.score ? (
          <div className="flex shrink-0 items-center gap-2 text-sm text-slate-300">
            <StarDisplay value={review.score} size={14} />
            <span className="tabular-nums">{review.score}/5</span>
          </div>
        ) : null}
      </header>

      <p className="mt-3 whitespace-pre-line break-words leading-relaxed text-slate-200">{review.content}</p>

      {currentUserId && <ReviewActions movieId={movieId} reviewId={review.id} isOwner={isOwner} />}
    </article>
  );
}