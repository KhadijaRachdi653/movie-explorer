import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import ProfileForm from "@/components/auth/ProfileForm";
import DeleteAccountCard from "@/components/auth/DeleteAccountCard";

export const metadata = { title: "Mon profil" };

// Profil (Module 1, Khadija) : données lues côté serveur, formulaires dans ProfileForm
export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectToDatabase();
  const dbUser = await User.findById(session.user.id).lean();
  if (!dbUser) redirect("/login");

  const userData = { email: dbUser.email, username: dbUser.name || "" };
  const isAdmin = dbUser.role === "admin";
  const isSubscribed = dbUser.isSubscribed !== false; // vrai par défaut

  const links = [
    { href: "/collection", label: "Ma collection", hint: "Favoris et films à voir, en cours, vus" },
    { href: "/subscriptions", label: "Mon abonnement", hint: "Offre, paiement et historique" },
    { href: "/lists", label: "Mes listes", hint: "Vos films rangés par thème" },
    { href: "/recommendations", label: "Pour vous", hint: "Vos recommandations" },
    { href: "/profile/ratings", label: "Mes notes et avis", hint: "Votre activité" },
  ];

  return (
    <div className="pb-20">
      {/* En-tête du profil */}
      <section className="relative isolate overflow-hidden border-b border-[var(--edge)] px-4 pb-10 pt-12 sm:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(242,181,68,0.18),transparent_55%)]" />
        <div className="flex flex-wrap items-center gap-6">
          <span aria-hidden className="flex size-20 items-center justify-center rounded-full bg-[var(--marquee)] text-4xl font-extrabold text-[#1a1203] shadow-xl shadow-black/40">
            {userData.username.charAt(0).toUpperCase() || "?"}
          </span>
          <div className="min-w-0">
            <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] font-extrabold leading-none tracking-[-0.03em]">{userData.username}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-[var(--mist)]">
              <span className="truncate">{userData.email}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isSubscribed ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-[var(--mist)]"}`}>
                {isSubscribed ? "Premium actif" : "Compte standard"}
              </span>
              {isAdmin && <span className="rounded-full bg-[var(--marquee)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--marquee)]">Administrateur</span>}
            </p>
          </div>
          {isAdmin && (
            <Link href="/admin/users" className="ml-auto rounded-md bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20">
              Espace administration
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-6 px-4 pt-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ProfileForm user={userData} isSubscribed={isSubscribed} />

        <aside className="space-y-6">
          <nav aria-label="Mon espace" className="rounded-xl border border-[var(--edge)] bg-[var(--deep)] p-6 sm:p-8">
            <h2 className="text-xl font-bold">Mon espace</h2>
            <ul className="mt-4 divide-y divide-[var(--edge)]">
              {links.map((l) => (
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
          <DeleteAccountCard />
        </aside>
      </div>
    </div>
  );
}
