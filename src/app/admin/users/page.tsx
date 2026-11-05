import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { redirect } from "next/navigation";
import { toggleUserBan, toggleUserRole } from "@/actions/userActions";

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

  const users = await User.find({}).sort({ createdAt: -1 });

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

      <div className="overflow-x-auto rounded-[22px] bg-[var(--surface)] border border-[var(--border-subtle)] shadow-xl transition-colors">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--background)] text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider transition-colors">
              <th className="p-5">Utilisateur</th>
              <th className="p-5">Email</th>
              <th className="p-5">Rôle actuel</th>
              <th className="p-5">Statut de validation</th>
              <th className="p-5 text-center">Actions de modération</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-sm font-medium transition-colors">
            {users.map((u) => {
              const isSelf = u._id.toString() === dbUser._id.toString();
              return (
                <tr key={u._id.toString()} className="hover:bg-[var(--background)]/40 transition-colors">
                  <td className="p-5 text-[var(--text-primary)] font-semibold">{u.name}</td>
                  <td className="p-5 text-[var(--text-muted)]">{u.email}</td>
                  <td className="p-5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                        u.role === 'admin'
                          ? 'bg-[var(--surface-variant)] text-[var(--accent-light)] border-[var(--border-subtle)]'
                          : 'bg-[var(--background)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {u.role?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-5">
                    <span
                      className={`text-xs font-bold transition-colors ${
                        u.valide ? 'text-[var(--text-primary)] opacity-80' : 'text-[var(--text-muted)] italic font-normal'
                      }`}
                    >
                      {u.valide ? "✓ Compte Validé" : "En attente / Bloqué"}
                    </span>
                  </td>
                  <td className="p-5 flex justify-center gap-4">
                    <form action={async () => { "use server"; await toggleUserBan(u._id.toString()); }}>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl font-bold text-xs text-[var(--text-primary)] border border-[var(--border-subtle)] bg-[var(--background)] hover:bg-[var(--surface-variant)] transition-all active:scale-95 cursor-pointer shadow-sm"
                      >
                        {u.valide ? "Bloquer" : "Activer"}
                      </button>
                    </form>

                    <form action={async () => { "use server"; await toggleUserRole(u._id.toString()); }}>
                      <button
                        type="submit"
                        disabled={isSelf}
                        className="px-4 py-2 rounded-xl font-bold text-xs bg-transparent text-[var(--accent-light)] border border-[var(--border-subtle)] hover:bg-[var(--surface-variant)] disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                      >
                        {u.role === "admin" ? "Rétrograder" : "Nommer Admin 🛡️"}
                      </button>
                    </form>
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
