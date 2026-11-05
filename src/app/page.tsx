import { auth } from "@/lib/auth";
import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppHeader />

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {session && (
          <div className="p-4 bg-blue-950/40 border border-blue-800/50 text-blue-200 rounded-lg text-sm">
            Ravi de vous revoir, <strong>{session.user?.name}</strong> ! Vous pouvez maintenant gérer vos listes de films favoris depuis votre espace.
          </div>
        )}

        <section className="text-center py-12 space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Explorez des milliers de films
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            Trouvez les dernières sorties, organisez vos favoris et consultez les avis de la communauté.
          </p>

          <div className="mt-8">
            <Link
              href="/discover"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              🔎 Découvrir des films
            </Link>
          </div>
          {session && (
            <Link href="/collection" className="inline-block rounded-lg border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition-colors hover:border-blue-500 hover:text-white">
              ♥ Ma collection
            </Link>
          )}
        </section>
      </main>
    </div>
  );
}
