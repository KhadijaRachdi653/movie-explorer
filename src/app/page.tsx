import { auth, signOut } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  const handleSignOut = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 p-4 flex justify-between items-center bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-500">
          🎬 Movie Explorer
        </div>

        <nav className="flex gap-4 items-center">
          {session ? (
            <>
              <span className="text-sm text-slate-400">
                Bonjour, <strong className="text-white">{session.user?.name}</strong> !
              </span>

              <Link href="/profile" className="text-sm text-slate-200 hover:text-white underline">
                Mon Profil
              </Link>

              <form action={handleSignOut} className="inline">
                <button
                  type="submit"
                  className="text-sm bg-red-600/80 hover:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors"
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm hover:underline">
                Se connecter
              </Link>
              <Link href="/register" className="text-sm bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md transition-colors">
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </header>

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

          <div className="mt-8 p-12 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
            [ Emplacement du catalogue de films  ]
          </div>
        </section>
      </main>
    </div>
  );
}
