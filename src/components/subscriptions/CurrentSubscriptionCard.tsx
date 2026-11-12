import Link from "next/link";
import { PERIOD_LABELS, formatPrice } from "@/modules/subscriptions/subscription.constants";
import type { SubscriptionDto } from "@/modules/subscriptions/subscription.service";
import SubscriptionActions from "./SubscriptionActions";
import { StatusBadge, formatDate } from "./ui";
import { tierStyle } from "./tiers";

const DAY = 24 * 60 * 60 * 1000;

// Carte « Mon offre actuelle » : statut, dates, jours restants (composant serveur, `now` vient de la page)
export default function CurrentSubscriptionCard({ current, now }: { current: SubscriptionDto | null; now: number }) {
  if (!current) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-[var(--edge)] bg-[var(--deep)]/60 p-6">
        <div>
          <p className="text-lg font-bold">Vous n&apos;avez pas encore d&apos;abonnement</p>
          <p className="mt-1 text-sm text-[var(--mist)]">Choisissez l&apos;offre qui vous ressemble : vous pourrez en changer à tout moment.</p>
        </div>
        <a href="#offres" className="rounded-md bg-[var(--marquee)] px-5 py-3 font-semibold text-[#1a1203] hover:bg-[#f7c766]">Voir les offres</a>
      </section>
    );
  }

  const start = new Date(current.startDate).getTime();
  const end = current.endDate ? new Date(current.endDate).getTime() : null;
  const pending = current.status === "pending";
  const progress = end ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)) : 0;
  const daysLeft = end ? Math.max(0, Math.ceil((end - now) / DAY)) : null;
  const daysToStart = pending ? Math.max(0, Math.ceil((start - now) / DAY)) : 0;

  const tier = tierStyle(current.planName);

  return (
    <section aria-labelledby="membre-title" className="grid items-center gap-8 rounded-2xl border border-[var(--edge)] bg-[var(--deep)] p-6 sm:p-8 lg:grid-cols-[380px_minmax(0,1fr)]">
      {/* Carte de membre, aux couleurs de l'offre */}
      <div className={`relative isolate aspect-[1.586] w-full max-w-[380px] overflow-hidden rounded-2xl p-6 shadow-2xl shadow-black/50 ring-1 ${tier.header} ${tier.text} ${tier.ring}`}>
        <div aria-hidden className="absolute -right-16 -top-16 -z-10 size-56 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="absolute -bottom-20 -left-10 -z-10 size-56 rounded-full bg-black/20 blur-2xl" />
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-sm font-extrabold tracking-tight">Movie Explorer</span>
            <span className="rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-bold backdrop-blur">{PERIOD_LABELS[current.billingPeriod]}</span>
          </div>
          <div>
            <p className="text-xs font-semibold opacity-75">Membre</p>
            <p id="membre-title" className="text-4xl font-extrabold tracking-[-0.03em]">{current.planName}</p>
          </div>
          <div className="flex items-end justify-between text-xs font-semibold opacity-85">
            <span>Depuis le {formatDate(current.startDate)}</span>
            <span>{formatPrice(current.price)}{current.price > 0 && ` / ${current.billingPeriod === "yearly" ? "an" : "mois"}`}</span>
          </div>
        </div>
      </div>

      {/* Statut, durée restante et actions */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-extrabold tracking-tight">Mon offre actuelle</h2>
          <StatusBadge status={current.status} />
        </div>

        <div className="mt-5">
          {pending ? (
            <p><span className="text-5xl font-extrabold text-[var(--marquee)]">J-{daysToStart}</span> <span className="text-[var(--mist)]">avant le début, le {formatDate(current.startDate)}</span></p>
          ) : daysLeft !== null ? (
            <p><span className="text-5xl font-extrabold">{daysLeft}</span> <span className="text-[var(--mist)]">jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}</span></p>
          ) : (
            <p className="text-[var(--mist)]">Sans date de fin</p>
          )}
        </div>

        {end && !pending && (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-[var(--raised)]" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Période écoulée">
              <div className="h-full rounded-full bg-gradient-to-r from-[#c98f1f] to-[#f7c766]" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-[var(--mist)]">
              <span>Début : {formatDate(current.startDate)}</span>
              <span>Fin : {formatDate(current.endDate)}</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <SubscriptionActions subscription={current} showChangePlan />
          <Link href={`/subscriptions/${current.id}`} className="text-sm font-semibold text-[var(--marquee)] hover:underline">
            Voir le détail ›
          </Link>
        </div>
      </div>
    </section>
  );
}
