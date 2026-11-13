import { auth } from "@/lib/auth";
import { listMovies, type MovieDto } from "@/modules/movies/movie.service";
import HomeView from "@/components/home/HomeView";

export const dynamic = "force-dynamic";

// Accueil : charge la session et le catalogue (Module 2) ; l'affichage est dans HomeView.
// La déconnexion se fait depuis l'en-tête commun (SiteHeader).
export default async function HomePage() {
  const session = await auth();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const { movies } = await listMovies(1, 60).catch(() => ({ movies: [] as MovieDto[] }));

  return <HomeView movies={movies} userName={session?.user?.name ?? null} isAdmin={isAdmin} />;
}
