import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/modules/reviews/http";
import { listMyActivity } from "@/modules/reviews/review.service";
import MyActivityCard from "@/components/reviews/MyActivityCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes notes et avis" };

export default async function MyRatingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const items = await listMyActivity(viewer.id);
  const rated = items.filter((i) => i.score !== null);
  const average = rated.length
    ? rated.reduce((s, i) => s + (i.score ?? 0), 0) / rated.length
    : 0;
  const likes = items.reduce((s, i) => s + (i.review?.likeCount ?? 0), 0);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] transition-colors">
      <main className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Mes notes et avis
          </h1>
          <Link
            href="/movies"
            className="text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Catalogue →
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Films notés", value: rated.length },
            {
              label: "Ma moyenne",
              value: rated.length ? `${average.toFixed(1)} ★` : "–",
            },
            { label: "Likes reçus", value: likes },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[var(--surface-variant)] bg-[var(--surface)] p-5 shadow-sm transition-colors"
            >
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {s.value}
              </p>
              <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--surface-variant)] bg-[var(--surface)]/50 p-8 text-center text-sm text-[var(--text-muted)]">
            Vous n&apos;avez encore noté aucun film.{" "}
            <Link
              href="/movies"
              className="font-semibold text-[var(--accent)] hover:underline"
            >
              Parcourir le catalogue
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <MyActivityCard key={item.movieId} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
