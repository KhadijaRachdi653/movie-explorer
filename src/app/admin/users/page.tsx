import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { redirect } from "next/navigation";
import { toggleUserBan, toggleUserRole } from "@/actions/userActions";

export default async function AdminUsersPage() {
  const session = await auth();
  await connectToDatabase();

  const dbUser = await User.findById(session?.user?.id);
  if (!dbUser || dbUser.role !== "admin") {
    redirect("/");
  }

  const users = await User.find({}).sort({ createdAt: -1 });

  return (
    <div className="mx-auto max-w-7xl p-6 text-white">
      {/* 💡 Votre titre parfaitement nettoyé ici */}
      <h1 className="text-3xl font-bold mb-6 text-blue-400">Gestion des Comptes & Rôles</h1>

      <div className="overflow-x-auto rounded-xl bg-slate-900 border border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-sm">
              <th className="p-4">Utilisateur</th>
              <th className="p-4">Email</th>
              <th className="p-4">Rôle actuel</th>
              <th className="p-4">Statut de validation</th>
              <th className="p-4 text-center">Actions de modération</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-sm">
            {users.map((u) => {
              const isSelf = u._id.toString() === dbUser._id.toString();
              return (
                <tr key={u._id.toString()} className="hover:bg-slate-800/50">
                  <td className="p-4 font-semibold text-slate-200">{u.name}</td>
                  <td className="p-4 text-slate-400">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                      {u.role?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.valide ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {u.valide ? "✓ Compte Validé" : "❌ En attente / Bloqué"}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-4">
                    {/* Bouton de Bannissement */}
                    <form action={async () => { "use server"; await toggleUserBan(u._id.toString()); }}>
                      <button type="submit" className={`px-3 py-1 rounded font-medium text-xs text-white ${u.valide ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
                        {u.valide ? "Bannir / Bloquer" : "Activer"}
                      </button>
                    </form>

                    {/* Bouton d'attribution de Rôle */}
                    <form action={async () => { "use server"; await toggleUserRole(u._id.toString()); }}>
                      <button type="submit" disabled={isSelf} className={`px-3 py-1 rounded font-medium text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-30`}>
                        {u.role === "admin" ? "Rétrograder en User" : "Nommer Administrateur 🛡️"}
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
