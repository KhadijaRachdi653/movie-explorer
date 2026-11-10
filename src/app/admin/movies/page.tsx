import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminMovies from "@/components/movies/AdminMovies";
import { listMovies } from "@/modules/movies/movie.service";

export const metadata = { title: "Gestion des films" };

export default async function AdminMoviesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const isAdmin =
    (session?.user as { role?: string } | undefined)?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto max-w-3xl p-4">
          <p className="text-slate-300">Accès réservé aux administrateurs.</p>
          <Link href="/movies" className="text-blue-400">
            Retour au catalogue
          </Link>
        </main>
      </div>
    );
  }

  const { movies } = await listMovies(1, 50);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-6xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gestion des films</h1>
          <Link href="/movies" className="text-sm text-blue-400">
            Catalogue
          </Link>
        </div>
        <AdminMovies movies={movies} />
      </main>
    </div>
  );
}
