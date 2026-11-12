import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/modules/reviews/http";
import { getSubscriptionStats } from "@/modules/subscriptions/subscription.service";
import { STATUS_LABELS, SUBSCRIPTION_STATUSES, formatPrice } from "@/modules/subscriptions/subscription.constants";
import AdminSubscriptions from "@/components/subscriptions/AdminSubscriptions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gestion des abonnements" };

export default async function AdminSubscriptionsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  if (!viewer.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto max-w-3xl p-4">
          <p className="text-slate-300">Accès réservé aux administrateurs.</p>
          <Link href="/subscriptions" className="text-blue-400">
            Retour à mon abonnement
          </Link>
        </main>
      </div>
    );
  }

  const stats = await getSubscriptionStats();
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const maxPlan = Math.max(1, ...stats.activeByPlan.map((p) => p.count));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-6xl space-y-6 p-4 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Gestion des abonnements</h1>
          <div className="flex gap-4 text-sm text-blue-400">
            <Link href="/">Accueil</Link>
            <Link href="/subscriptions">Mon abonnement</Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Abonnements actifs</p>
            <p className="mt-1 text-3xl font-bold text-emerald-300">{stats.byStatus.active}</p>
            <p className="text-xs text-slate-500">sur {stats.total} au total</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Revenu mensuel estimé</p>
            <p className="mt-1 text-3xl font-bold">{formatPrice(stats.monthlyRevenue)}</p>
            <p className="text-xs text-slate-500">annuels ramenés au mois (simulation)</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Répartition des statuts</p>
            <ul className="mt-2 space-y-1 text-sm">
              {SUBSCRIPTION_STATUSES.map((s) => (
                <li key={s} className="flex justify-between">
                  <span className="text-slate-400">{STATUS_LABELS[s]}</span>
                  <span className="font-semibold">{stats.byStatus[s]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Offres actives</p>
            {stats.activeByPlan.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Aucun abonnement actif.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {stats.activeByPlan.map((p) => (
                  <li key={p.planName}>
                    <div className="flex justify-between">
                      <span>{p.planName}</span>
                      <span className="font-semibold">{p.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${(p.count / maxPlan) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <AdminSubscriptions reloadKey={now} />
      </main>
    </div>
  );
}
