import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/modules/reviews/http";
import { getCurrentSubscription } from "@/modules/subscriptions/subscription.service";
import CurrentSubscriptionCard from "@/components/subscriptions/CurrentSubscriptionCard";
import PlanGrid from "@/components/subscriptions/PlanGrid";
import SubscriptionHistory from "@/components/subscriptions/SubscriptionHistory";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon abonnement" };

export default async function SubscriptionsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const current = await getCurrentSubscription(viewer.id);
  // Horodatage du rendu : sert au calcul des jours restants et à recharger l'historique après chaque action
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-5xl space-y-8 p-4 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold">Mon abonnement</h1>
            <p className="text-sm text-slate-400">Gérez votre offre CINEA, changez de formule ou résiliez à tout moment.</p>
          </div>
          <div className="flex gap-4 text-sm text-blue-400">
            <Link href="/">Accueil</Link>
            <Link href="/movies">Catalogue</Link>
            {viewer.isAdmin && <Link href="/admin/subscriptions">Gérer les abonnements</Link>}
          </div>
        </div>

        <CurrentSubscriptionCard current={current} now={now} />
        <PlanGrid current={current} />
        <SubscriptionHistory reloadKey={now} />

        <p className="text-center text-xs text-slate-500">
          Projet pédagogique : les offres et paiements sont simulés et ne modifient pas l&apos;accès aux fonctionnalités.
        </p>
      </main>
    </div>
  );
}
