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
  const average = rated.length ? rated.reduce((s, i) => s + (i.score ?? 0), 0) / rated.length : 0;
  const likes = items.reduce((s, i) => s + (i.review?.likeCount ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-4xl p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mes notes et avis</h1>
          <Link href="/movies" className="text-sm text-blue-400">
            Catalogue →
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Films notés", value: rated.length },
            { label: "Ma moyenne", value: rated.length ? `${average.toFixed(1)} ★` : "–" },
            { label: "Likes reçus", value: likes },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-slate-400">
            Vous n&apos;avez encore noté aucun film.{" "}
            <Link href="/movies" className="text-blue-400 hover:underline">
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
