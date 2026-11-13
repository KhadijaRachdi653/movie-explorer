import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/modules/reviews/http";
import { getCurrentSubscription } from "@/modules/subscriptions/subscription.service";
import CurrentSubscriptionCard from "@/components/subscriptions/CurrentSubscriptionCard";
import PlanGrid from "@/components/subscriptions/PlanGrid";
import SubscriptionHistory from "@/components/subscriptions/SubscriptionHistory";
import { listMovies } from "@/modules/movies/movie.service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon abonnement" };

export default async function SubscriptionsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const current = await getCurrentSubscription(viewer.id);
  // Horodatage du rendu : sert au calcul des jours restants et à recharger l'historique après chaque action
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  // Affiches du catalogue pour la bannière (décor uniquement)
  const posters = await listMovies(1, 12)
    .then((r) => r.movies.map((m) => m.posterUrl).filter(Boolean).slice(0, 12))
    .catch(() => [] as string[]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Bannière : mosaïque d'affiches floutée */}
      <section className="relative isolate overflow-hidden px-4 pb-14 pt-14 sm:px-8">
        <div aria-hidden className="absolute inset-0 -z-20 grid -rotate-3 scale-110 grid-cols-6 gap-2 opacity-30 blur-[2px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {posters.map((src, i) => <img key={i} src={src} alt="" className="aspect-[2/3] w-full object-cover" />)}
        </div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--night)]/70 via-[var(--night)]/85 to-[var(--night)]" />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-[clamp(2.5rem,6vw,4.75rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
            {current ? "Mon abonnement" : <>Le cinéma, <span className="text-[var(--marquee)]">à votre façon.</span></>}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--ink)]/80">
            Gérez votre offre, changez de formule ou résiliez à tout moment.
          </p>
          {viewer.isAdmin && (
            <Link href="/admin/subscriptions" className="mt-6 inline-block text-sm font-semibold text-[var(--marquee)] hover:underline">
              Gérer les abonnements (admin)
            </Link>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-16 px-4 pb-24 sm:px-8">
        <CurrentSubscriptionCard current={current} now={now} />
        <PlanGrid current={current} />
        <SubscriptionHistory reloadKey={now} />

        <p className="text-center text-xs text-[var(--mist)]">
          Projet pédagogique : les offres et paiements sont simulés et ne modifient pas l&apos;accès aux fonctionnalités.
        </p>
      </main>
    </div>
  );
}
