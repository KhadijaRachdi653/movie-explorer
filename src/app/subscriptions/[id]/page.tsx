import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getViewer } from "@/modules/reviews/http";
import { isValidSubscriptionId } from "@/modules/subscriptions/subscription.schema";
import { getSubscription } from "@/modules/subscriptions/subscription.service";
import { PERIOD_LABELS, formatPrice } from "@/modules/subscriptions/subscription.constants";
import SubscriptionActions from "@/components/subscriptions/SubscriptionActions";
import { PeriodBadge, StatusBadge, formatDate } from "@/components/subscriptions/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Détail de l'abonnement" };

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { id } = await params;
  if (!isValidSubscriptionId(id)) notFound();
  const sub = await getSubscription(id, viewer).catch(() => null);
  if (!sub) notFound();

  const back = sub.isMine ? "/subscriptions" : "/admin/subscriptions";
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const timeline = [
    { label: "Créé", date: sub.createdAt, done: true },
    { label: "Début", date: sub.startDate, done: new Date(sub.startDate).getTime() <= now },
    {
      label: sub.status === "cancelled" ? "Résilié" : sub.status === "expired" ? "Expiré" : "Fin prévue",
      date: sub.endDate,
      done: !!sub.endDate && new Date(sub.endDate).getTime() <= now,
    },
  ];

  const rows: [string, React.ReactNode][] = [
    ["Offre", sub.planName],
    ["Prix", `${formatPrice(sub.price)}${sub.price > 0 ? ` / ${sub.billingPeriod === "yearly" ? "an" : "mois"}` : ""}`],
    ["Facturation", PERIOD_LABELS[sub.billingPeriod]],
    ["Date de début", formatDate(sub.startDate)],
    ["Date de fin", sub.endDate ? formatDate(sub.endDate) : "Sans date de fin"],
    ["Dernière modification", formatDate(sub.updatedAt)],
  ];
  if (!sub.isMine) rows.unshift(["Abonné", `${sub.user.name} (${sub.user.email})`]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-3xl space-y-6 p-4 pb-24">
        <Link href={back} className="text-sm text-blue-400">
          ← {sub.isMine ? "Mon abonnement" : "Gestion des abonnements"}
        </Link>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Abonnement</p>
              <h1 className="text-2xl font-bold">CINEA {sub.planName}</h1>
              {sub.description && <p className="mt-1 text-sm text-slate-400">{sub.description}</p>}
            </div>
            <div className="flex gap-2">
              <StatusBadge status={sub.status} />
              <PeriodBadge period={sub.billingPeriod} />
            </div>
          </div>

          {/* Frise des dates clés */}
          <ol className="mt-6 grid grid-cols-3">
            {timeline.map((step, i) => (
              <li key={step.label} className="relative flex flex-col items-center text-center">
                {i > 0 && (
                  <span className={`absolute right-1/2 top-2 h-0.5 w-full ${step.done ? "bg-blue-500" : "bg-slate-700"}`} />
                )}
                <span
                  className={`relative z-10 h-4 w-4 rounded-full border-2 ${step.done ? "border-blue-500 bg-blue-500" : "border-slate-600 bg-slate-900"}`}
                />
                <span className="mt-2 text-xs font-medium">{step.label}</span>
                <span className="text-xs text-slate-400">{formatDate(step.date)}</span>
              </li>
            ))}
          </ol>

          <dl className="mt-6 divide-y divide-slate-800 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-400">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          {sub.isMine && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <SubscriptionActions subscription={sub} afterDelete="/subscriptions" />
              {(sub.status === "active" || sub.status === "pending") && (
                <Link href="/subscriptions#offres" className="text-sm text-blue-400 hover:underline">
                  Changer d&apos;offre →
                </Link>
              )}
            </div>
          )}
          {!sub.isMine && (
            <p className="mt-6 text-sm text-slate-400">
              Modifiez ou supprimez cet abonnement depuis{" "}
              <Link href="/admin/subscriptions" className="text-blue-400 hover:underline">
                la gestion des abonnements
              </Link>
              .
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
