import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserRatings } from "@/lib/reviews";
import StarDisplay from "@/components/reviews/StarDisplay";

export const metadata = { title: "Mes notes" };

export default async function MyRatingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const ratings = await getUserRatings(session.user.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <nav className="mb-6 text-sm">
        <Link href="/profile" className="text-slate-400 hover:text-slate-100">
          ← Mon profil
        </Link>
      </nav>

      <h1 className="text-3xl font-bold">Mes notes</h1>
      <p className="mt-1 text-slate-400">
        {ratings.length === 0
          ? "Vous n'avez noté aucun film."
          : `${ratings.length} film${ratings.length > 1 ? "s" : ""} noté${ratings.length > 1 ? "s" : ""}`}
      </p>

      {ratings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-700 p-8 text-center">
          <p className="font-medium">Votre liste est vide</p>
          <p className="mt-1 text-sm text-slate-400">Ouvrez la page d&apos;un film pour lui donner une note.</p>
          <Link href="/" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Parcourir les films
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {ratings.map((r) => (
            <li
              key={r.movieId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4"
            >
              <div>
                {/* TODO: show the movie title from Movie Management */}
                <p className="font-medium">Film n° {r.movieId}</p>
                <p className="text-xs text-slate-400">
                  Noté le{" "}
                  {new Date(r.updatedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <StarDisplay value={r.score} size={16} />
                  <span className="tabular-nums">{r.score}/5</span>
                </div>
                <Link
                  href={`/movies/${r.movieId}/reviews`}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
                >
                  Voir ou modifier
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}