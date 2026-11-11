import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { redirect } from "next/navigation";
import { toggleUserBan, toggleUserRole } from "@/actions/userActions";
import Link from "next/link";
import PushRegisterButton from "@/components/admin/PushRegisterButton";

export const metadata = {
  title: "Administration | CINEA",
};

export default async function AdminUsersPage() {
  const session = await auth();
  await connectToDatabase();

  const dbUser = await User.findById(session?.user?.id);
  if (!dbUser || dbUser.role !== "admin") {
    redirect("/");
  }

  // Extraction brute des comptes
  const rawUsers = await User.find({}).sort({ createdAt: -1 }).lean();

  // 💡 SÉCURISATION DES PLAN OBJECTS : Conversion manuelle pour éliminer l'erreur de transfert
  const users = rawUsers.map((u) => ({
    id: u._id.toString(),
    name: String(u.name || "Cinéphile"),
    email: String(u.email || ""),
    role: String(u.role || "user"),
    valide: Boolean(u.valide),
  }));

  const currentAdminId = dbUser._id.toString();

  return (
    <div className="mx-auto max-w-7xl p-6 text-[var(--text-primary)] transition-all">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--accent-light)]">
          Gestion des Comptes & Rôles
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 font-medium">
          Panneau de modération et d'administration de la plateforme CINEA
        </p>
      </div>

      {/* Le bouton d'appairage Push native */}
      <PushRegisterButton />

      <div className="overflow-x-auto rounded-[22px] bg-[var(--surface)] border border-[var(--border-subtle)] shadow-xl transition-colors">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--background)] text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider transition-colors">
              <th className="p-5 pl-8">Utilisateur</th>
              <th className="p-5">Email</th>
              <th className="p-5">Rôle actuel</th>
              <th className="p-5">Statut de validation</th>
              <th className="p-5 text-center">Actions de modération</th>
              <th className="p-5 pr-8 text-right">Fiche</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-medium transition-colors">
            {users.map((u) => {
              const isSelf = u.id === currentAdminId;
              const userDetailUrl = `/admin/users/${u.id}`;

              return (
                <tr
                  key={u.id}
                  className="user-row hover:bg-[var(--background)]/40 transition-colors"
                  tabIndex={0}
                >
                  {/* Colonne Utilisateur */}
                  <td className="p-5 pl-8 font-semibold text-[var(--text-primary)]">
                    <Link href={userDetailUrl} className="block w-full h-full">
                      {u.name}
                    </Link>
                  </td>

                  {/* Colonne Email */}
                  <td className="p-5 text-[var(--text-muted)]">
                    <Link href={userDetailUrl} className="block w-full h-full">
                      {u.email}
                    </Link>
                  </td>

                  {/* Colonne Rôle actuel */}
                  <td className="p-5">
                    <Link href={userDetailUrl} className="inline-block">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${u.role === 'admin' ? 'bg-[var(--surface-variant)] text-[var(--accent-light)] border-[var(--border-subtle)]' : 'bg-[var(--background)] text-[var(--text-muted)] border-[var(--border-subtle)]'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </Link>
                  </td>

                  {/* Colonne Statut de validation */}
                  <td className="p-5">
                    <Link href={userDetailUrl} className="inline-block">
                      <span className={`status-pill ${u.valide ? "status--active" : "status--blocked"}`}>
                        {u.valide ? "Compte Validé" : "Compte Bloqué"}
                      </span>
                    </Link>
                  </td>

                  {/* Colonne Actions de modération */}
                  <td className="p-5 flex justify-center gap-4">
                    <form action={async () => { "use server"; await toggleUserBan(u.id); }}>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl font-bold text-xs text-[var(--text-primary)] border border-[var(--border-subtle)] bg-[var(--background)] hover:bg-[var(--surface-variant)] transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        {u.valide ? "Bloquer" : "Activer"}
                      </button>
                    </form>

                    <form action={async () => { "use server"; await toggleUserRole(u.id); }}>
                      <button
                        type="submit"
                        disabled={isSelf}
                        className="px-4 py-2 rounded-xl font-bold text-xs bg-transparent text-[var(--accent-light)] border border-[var(--accent)] hover:bg-[var(--surface-variant)] disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                      >
                        {u.role === "admin" ? "Rétrograder" : "Nommer Admin 🛡️"}
                      </button>
                    </form>
                  </td>

                  {/* Discret chevron navigable Figma */}
                  <td className="p-5 pr-8 text-right text-base font-bold">
                    <Link href={userDetailUrl} className="row-chevron">
                      ›
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
