import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Fiche Utilisateur | CINEA",
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 1. 🔒 Verrou de sécurité : Zone réservée aux administrateurs
  const session = await auth();
  await connectToDatabase();
  const currentAdmin = await User.findById(session?.user?.id);

  if (!currentAdmin || currentAdmin.role !== "admin") {
    redirect("/");
  }

  const userId = (await params).id;

  // 2. 🔍 Extraction des données de l'étudiant ciblé
  const targetUser = await User.findById(userId).lean();

  if (!targetUser) {
    return (
      <div className="mx-auto max-w-md p-8 text-center text-[var(--text-primary)]">
        <p className="text-red-500 font-bold mb-4">Utilisateur introuvable.</p>
        <Link href="/admin/users" className="text-[var(--accent)] font-bold underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 text-[var(--text-primary)] transition-all">

      {/* Bouton de retour discret */}
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-xs font-bold mountaineer uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          ← Retour au Panneau Général
        </Link>
      </div>

      {/* 💼 FICHE D'IDENTITÉ PREMIUM STYLE FIGMA — SANS BORDURE NOIRE DUR */}
      <div className="rounded-[22px] bg-[var(--surface)] border border-[var(--border-subtle)] p-8 shadow-xl space-y-6 transition-colors">

        <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] pb-6">
          {/* Avatar avec initiale automatique */}
          <div className="h-16 w-16 rounded-full bg-[var(--background)] border border-[var(--border-subtle)] flex items-center justify-center text-xl font-black text-[var(--accent)]">
            {targetUser.name ? (targetUser.name as string).charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--accent)] uppercase tracking-tight">
              {targetUser.name as string}
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-medium">Identifiant Système : {userId}</p>
          </div>
        </div>

        {/* Grille d'informations sémantiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-1">
              Adresse électronique
            </span>
            <p className="font-semibold text-[var(--text-primary)]">{targetUser.email as string}</p>
          </div>

          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-1">
              Rôle d'accès plateforme
            </span>
            <p className="font-semibold text-[var(--accent)] uppercase">{targetUser.role as string || "user"}</p>
          </div>

          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-1">
              Date d'inscription au catalogue
            </span>
            <p className="font-semibold text-[var(--text-muted)]">
              {targetUser.createdAt
                ? new Date(targetUser.createdAt as Date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                : "—"}
            </p>
          </div>

          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-1">
              Dernière activité de session
            </span>
            <p className="font-semibold text-[var(--text-muted)]">
              {targetUser.updatedAt
                ? new Date(targetUser.updatedAt as Date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
                : "—"}
            </p>
          </div>
        </div>

                {/* 🎬 LIAISON INTER-MODULES (Version épurée avec le terme Cinéphile) */}
                <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] bg-[var(--background)]/30 rounded-xl p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--accent)] mb-2">
                    Activité Cinéma du Cinéphile
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-medium italic">
                    Les modules Watchlist & Favoris n'ont pas encore de données liées en base pour ce compte. Les films enregistrés par ce membre s'afficheront dynamiquement ici lors de l'intégration finale.
                  </p>
                </div>
      </div>
    </div>
  );
}
