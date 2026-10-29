"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, deleteAccount, getAllUsers } from "@/actions/userActions";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [role, setRole] = useState<string>("user"); // 💡 AJOUT : Stocker le rôle de l'utilisateur
  const [usersList, setUsersList] = useState<AdminUser[]>([]); // 💡 AJOUT : Stocker la liste des utilisateurs pour l'admin
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/session");
        const session = await response.json();

        if (!session || !session.user) {
          router.push("/login");
          return;
        }

        setUser({
          name: session.user.name || "",
          email: session.user.email || ""
        });

        const userRole = session.user.role || "user";
        setRole(userRole);

        if (userRole === "admin") {
          const list = await getAllUsers();
          setUsersList(list);
        }
      } catch (err) {
        router.push("/login");
      }
    }
    loadProfile();
  }, [router]);

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const res = await updateProfile(formData);

    if (res?.error) {
      setError(res.error);
    } else {
      setMessage(res?.success || "Profil mis à jour !");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement votre compte ?")) return;

    setLoading(true);
    const res = await deleteAccount();

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      window.location.href = "/login";
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white">
        <p className="text-sm text-slate-400 animate-pulse">Chargement de votre espace profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 mt-10 space-y-6 pb-12">
      <div className="mx-auto max-w-md p-6 bg-slate-900 rounded-2xl text-white shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold">Mon Profil</h1>
            <p className="text-xs text-slate-400 mt-1">Espace de gestion de compte</p>
          </div>
          <button
            onClick={() => window.location.href = "/api/auth/signout"}
            className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium hover:bg-slate-700 transition"
          >
            Déconnexion
          </button>
        </div>

        <form onSubmit={handleUpdate} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">Nom d'utilisateur</label>
            <input
              name="name"
              type="text"
              defaultValue={user.name}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-500">Adresse e-mail (Non modifiable)</label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-slate-500 cursor-not-allowed"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-400">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 p-3 font-semibold hover:bg-emerald-700 transition disabled:bg-emerald-800 disabled:cursor-not-allowed"
          >
            {loading ? "Mise à jour..." : "Mettre à jour les informations"}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800 pt-6">
          <h2 className="text-lg font-semibold text-red-400">Zone de danger</h2>
          <p className="text-xs text-slate-400 mt-1">La suppression est immédiate et irréversible.</p>
          <form onSubmit={handleDelete} className="mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-red-600 p-3 font-semibold hover:bg-red-700 transition disabled:bg-red-800"
            >
              Supprimer définitivement mon compte
          </button>
          </form>
        </div>
      </div>

      {role === "admin" && (
        <div className="mx-auto max-w-4xl p-6 bg-slate-900 rounded-2xl text-white shadow-xl border border-slate-800">
          <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
            📋 Liste des Utilisateurs Enregistrés
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">Gestion des comptes et des droits d'accès</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="p-3">Nom complet</th>
                  <th className="p-3">Adresse e-mail</th>
                  <th className="p-3">Rôle</th>
                  <th className="p-3">Créé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500 text-xs italic">
                      Aucun autre utilisateur trouvé ou chargement en cours...
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-medium text-white">{u.name}</td>
                      <td className="p-3 text-slate-400">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'bg-purple-900/60 text-purple-200 border border-purple-700'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
