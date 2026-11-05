import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import ProfileForm from "@/components/auth/ProfileForm";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Mon Profil | CINEA",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await connectToDatabase();
  const dbUser = await User.findById(session.user.id).lean();

  if (!dbUser) {
    redirect("/login");
  }

  const userData = {
    email: dbUser.email,
    username: dbUser.name || "",
    avatar: dbUser.avatar || "",
  };

  const isAdmin = dbUser.role === "admin";
  const isSubscribed = dbUser.isSubscribed !== false; // Vrai par défaut

  return (
    <div className="mx-auto max-w-4xl p-6 text-[var(--text-primary)] transition-all">
      <div className="flex justify-between items-center mb-8 border-b border-[var(--surface-variant)] pb-4 transition-colors">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--accent)]">
            Gestion de mon compte
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <p className="text-sm text-[var(--text-muted)] font-medium">
              Espace membre — Rôle : <span className="font-bold text-[var(--accent-light)]">{dbUser.role?.toUpperCase() || "USER"}</span>
            </p>
            <span className="text-[var(--text-muted)] opacity-40">•</span>
            {/* 💡 BADGE D'ABONNEMENT PREMIUM CONFORME FIGMA */}
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
              isSubscribed
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-500 border-amber-500/20"
            }`}>
              {isSubscribed ? "✨ Premium Actif" : "👤 Compte Gratuit"}
            </span>
          </div>
        </div>

        {isAdmin && (
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-transparent text-[var(--accent)] border border-[var(--accent)] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[var(--surface-variant)] transition-all shadow-sm active:scale-95"
          >
            🛡️ Espace Admin
          </Link>
        )}
      </div>

      <ProfileForm user={userData} isSubscribed={isSubscribed} />
    </div>
  );
}
