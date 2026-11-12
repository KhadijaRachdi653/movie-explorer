"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile, deleteAccount, getAllUsers } from "@/actions/authActions";

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

  const field = "w-full rounded-md border border-[var(--edge)] bg-[var(--night)] px-4 py-3 text-[var(--ink)] transition-colors focus:border-[var(--marquee)] focus:outline-none";
  const card = "rounded-xl border border-[var(--edge)] bg-[var(--deep)] p-6 sm:p-8";

  if (!user) {
    return (
      <div className="px-4 pt-12 sm:px-8" aria-busy="true">
        <div className="skeleton h-28 max-w-xl rounded-xl" />
        <p className="sr-only">Chargement de votre espace profil…</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* En-tête du profil */}
      <section className="relative isolate overflow-hidden border-b border-[var(--edge)] px-4 pb-10 pt-12 sm:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(242,181,68,0.18),transparent_55%)]" />
        <div className="flex flex-wrap items-center gap-6">
          <span aria-hidden className="flex size-20 items-center justify-center rounded-full bg-[var(--marquee)] text-4xl font-extrabold text-[#1a1203] shadow-xl shadow-black/40">
            {user.name.charAt(0).toUpperCase() || "?"}
          </span>
          <div className="min-w-0">
            <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold leading-none tracking-[-0.03em]">{user.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-[var(--mist)]">
              <span className="truncate">{user.email}</span>
              {role === "admin" && <span className="rounded-full bg-[var(--marquee)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--marquee)]">Administrateur</span>}
            </p>
          </div>
          <button
            onClick={() => window.location.href = "/api/auth/signout"}
            className="ml-auto rounded-md bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20"
          >
            Déconnexion
          </button>
        </div>
      </section>

      <div className="grid gap-6 px-4 pt-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {/* Informations du compte */}
          <section className={card} aria-labelledby="infos-title">
            <h2 id="infos-title" className="text-xl font-bold">Informations du compte</h2>
            <form onSubmit={handleUpdate} className="mt-6 space-y-5">
              <div>
                <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-[var(--ink)]/85">Nom d&apos;utilisateur</label>
                <input id="profile-name" name="name" type="text" defaultValue={user.name} required autoComplete="name" className={field} />
              </div>
              <div>
                <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium text-[var(--ink)]/85">Adresse e-mail</label>
                <input id="profile-email" type="email" disabled value={user.email} aria-describedby="email-help" className={`${field} cursor-not-allowed text-[var(--mist)]`} />
                <p id="email-help" className="mt-1.5 text-xs text-[var(--mist)]">L&apos;adresse e-mail ne peut pas être modifiée.</p>
              </div>

              {error && <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
              {message && <p role="status" className="rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-[var(--marquee)] px-6 py-3 font-semibold text-[#1a1203] transition-colors hover:bg-[#f7c766] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Mise à jour…" : "Enregistrer les modifications"}
              </button>
            </form>
          </section>

          {/* Administration : liste des utilisateurs */}
          {role === "admin" && (
            <section className={card} aria-labelledby="users-title">
              <h2 id="users-title" className="text-xl font-bold">Utilisateurs enregistrés</h2>
              <p className="mt-1 text-sm text-[var(--mist)]">Gestion des comptes et des droits d&apos;accès</p>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-[var(--mist)]">
                    <tr className="border-b border-[var(--edge)]">
                      <th scope="col" className="py-3 pr-4 font-medium">Nom complet</th>
                      <th scope="col" className="py-3 pr-4 font-medium">Adresse e-mail</th>
                      <th scope="col" className="py-3 pr-4 font-medium">Rôle</th>
                      <th scope="col" className="py-3 font-medium">Créé le</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--edge)]">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-sm text-[var(--mist)]">
                          Aucun autre utilisateur trouvé ou chargement en cours…
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} className="transition-colors hover:bg-white/5">
                          <td className="py-3 pr-4 font-medium">{u.name}</td>
                          <td className="py-3 pr-4 text-[var(--mist)]">{u.email}</td>
                          <td className="py-3 pr-4">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === "admin" ? "bg-[var(--marquee)]/15 text-[var(--marquee)]" : "bg-white/10 text-[var(--ink)]/80"}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 text-xs text-[var(--mist)]">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {/* Accès rapides */}
          <nav aria-label="Mon espace" className={card}>
            <h2 className="text-xl font-bold">Mon espace</h2>
            <ul className="mt-4 divide-y divide-[var(--edge)]">
              {[
                { href: "/lists", label: "Mes listes", hint: "Vos films rangés par thème" },
                { href: "/recommendations", label: "Pour vous", hint: "Vos recommandations" },
                { href: "/profile/ratings", label: "Mes notes et avis", hint: "Votre activité" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group flex items-center justify-between gap-4 py-3.5">
                    <span>
                      <span className="block font-semibold group-hover:text-[var(--marquee)]">{l.label}</span>
                      <span className="block text-sm text-[var(--mist)]">{l.hint}</span>
                    </span>
                    <span aria-hidden className="text-xl text-[var(--mist)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--marquee)]">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Zone de danger */}
          <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-6" aria-labelledby="danger-title">
            <h2 id="danger-title" className="text-lg font-bold text-red-300">Supprimer mon compte</h2>
            <p className="mt-1 text-sm text-[var(--mist)]">La suppression est immédiate et irréversible.</p>
            <form onSubmit={handleDelete} className="mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md border border-red-500/50 px-4 py-3 font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
              >
                Supprimer définitivement mon compte
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
