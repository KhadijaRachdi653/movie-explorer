import Link from "next/link";
import { PERIOD_LABELS, formatPrice } from "@/modules/subscriptions/subscription.constants";
import type { SubscriptionDto } from "@/modules/subscriptions/subscription.service";
import SubscriptionActions from "./SubscriptionActions";
import { StatusBadge, formatDate } from "./ui";

const DAY = 24 * 60 * 60 * 1000;

// Carte « Mon offre actuelle » : statut, dates, jours restants (composant serveur, `now` vient de la page)
export default function CurrentSubscriptionCard({ current, now }: { current: SubscriptionDto | null; now: number }) {
  if (!current) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center">
        <p className="text-3xl">🎟️</p>
        <p className="mt-2 font-semibold">Vous n&apos;avez pas d&apos;abonnement en cours</p>
        <p className="mt-1 text-sm text-slate-400">Choisissez une offre ci-dessous pour rejoindre CINEA.</p>
      </section>
    );
  }

  const start = new Date(current.startDate).getTime();
  const end = current.endDate ? new Date(current.endDate).getTime() : null;
  const pending = current.status === "pending";
  const progress = end ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)) : 0;
  const daysLeft = end ? Math.max(0, Math.ceil((end - now) / DAY)) : null;
  const daysToStart = pending ? Math.max(0, Math.ceil((start - now) / DAY)) : 0;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-600/10 blur-2xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Mon offre actuelle</p>
          <h2 className="mt-1 text-3xl font-extrabold">
            CINEA <span className="text-blue-400">{current.planName}</span>
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <StatusBadge status={current.status} />
            <span>
              {formatPrice(current.price)}
              {current.price > 0 && ` / ${current.billingPeriod === "yearly" ? "an" : "mois"}`} · {PERIOD_LABELS[current.billingPeriod]}
            </span>
          </div>
        </div>
        <div className="text-right">
          {pending ? (
            <>
              <p className="text-3xl font-extrabold text-amber-300">J-{daysToStart}</p>
              <p className="text-xs text-slate-400">avant le début</p>
            </>
          ) : daysLeft !== null ? (
            <>
              <p className="text-3xl font-extrabold">{daysLeft}</p>
              <p className="text-xs text-slate-400">jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Sans date de fin</p>
          )}
        </div>
      </div>

      {end && !pending && (
        <div className="relative mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-slate-400">
            <span>Début : {formatDate(current.startDate)}</span>
            <span>Fin : {formatDate(current.endDate)}</span>
          </div>
        </div>
      )}
      {pending && <p className="relative mt-4 text-sm text-slate-400">Commence le {formatDate(current.startDate)}.</p>}

      <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
        <SubscriptionActions subscription={current} showChangePlan />
        <Link href={`/subscriptions/${current.id}`} className="text-sm text-blue-400 hover:underline">
          Voir le détail →
        </Link>
      </div>
    </section>
  );
}
