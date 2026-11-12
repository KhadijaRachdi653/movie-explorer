"use client";

import { useState } from "react";
import { PLANS, formatPrice, monthlyEquivalent, planPrice, type BillingPeriod, type PlanDefinition } from "@/modules/subscriptions/subscription.constants";
import type { SubscriptionDto } from "@/modules/subscriptions/subscription.service";
import CheckoutModal from "./CheckoutModal";
import { comparisonRows, planQuality, tierStyle } from "./tiers";

// Grille des offres : souscrire, ou changer d'offre si un abonnement est en cours
export default function PlanGrid({ current }: { current: SubscriptionDto | null }) {
  const [period, setPeriod] = useState<BillingPeriod>(current?.billingPeriod ?? "monthly");
  const [selected, setSelected] = useState<PlanDefinition | null>(null);
  const table = comparisonRows();

  return (
    <section id="offres" className="scroll-mt-20" aria-labelledby="offres-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="offres-title" className="text-[clamp(1.8rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.03em]">
            {current ? "Changer d'offre" : "Choisissez votre expérience"}
          </h2>
          <p className="mt-1 text-[var(--mist)]">Sans engagement, résiliable à tout moment. L&apos;annuel vous offre 2 mois.</p>
        </div>
        <div className="inline-flex rounded-full border border-[var(--edge)] bg-[var(--deep)] p-1" role="tablist" aria-label="Période de facturation">
          {(["monthly", "yearly"] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={period === p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${period === p ? "bg-[var(--marquee)] text-[#1a1203]" : "text-[var(--mist)] hover:text-[var(--ink)]"}`}
            >
              {p === "monthly" ? "Mensuel" : "Annuel"}
              {p === "yearly" && <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${period === p ? "bg-black/15" : "bg-[var(--marquee)]/15 text-[var(--marquee)]"}`}>2 mois offerts</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid items-stretch gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const price = planPrice(plan, period);
          const isCurrent = current?.planName === plan.name && current.billingPeriod === period;
          const isUpgrade = current
            ? monthlyEquivalent(price, period) > monthlyEquivalent(current.price, current.billingPeriod)
            : false;
          const cta = !current ? `Choisir ${plan.name}` : isCurrent ? "Offre actuelle" : isUpgrade ? "Passer à " + plan.name : "Rétrograder";
          const tier = tierStyle(plan.name);
          const quality = planQuality(plan);

          return (
            <article
              key={plan.name}
              className={`relative flex flex-col overflow-hidden rounded-2xl bg-[var(--deep)] ring-1 transition duration-300 ${
                plan.highlight ? `${tier.ring} shadow-2xl shadow-[#f2b544]/10 md:-translate-y-3` : `${tier.ring} hover:-translate-y-1`
              } ${isCurrent ? "ring-2 ring-emerald-400/70" : ""}`}
            >
              {/* En-tête coloré de l'offre */}
              <div className={`relative px-6 pb-6 pt-7 ${tier.header} ${tier.text}`}>
                {(plan.highlight || isCurrent) && (
                  <span className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold ${isCurrent ? "bg-emerald-500 text-white" : "bg-black/80 text-[var(--marquee)]"}`}>
                    {isCurrent ? "Votre offre" : plan.tagline}
                  </span>
                )}
                <h3 className="text-2xl font-extrabold tracking-tight">{plan.name}</h3>
                <p className="text-sm opacity-80">{quality ? `Qualité ${quality}` : plan.tagline}</p>
                <p className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-5xl font-extrabold tracking-[-0.04em]">{price === 0 ? "0" : price.toLocaleString("fr-FR")}</span>
                  <span className="text-sm font-semibold opacity-80">TND / {period === "yearly" ? "an" : "mois"}</span>
                </p>
                <p className="mt-1 min-h-5 text-xs font-medium opacity-80">
                  {period === "yearly" && price > 0 ? `soit ${formatPrice(Math.round((price / 12) * 100) / 100)} par mois` : price === 0 ? "Gratuit, pour toujours" : " "}
                </p>
              </div>

              {/* Avantages */}
              <div className="flex flex-1 flex-col p-6">
                <p className="text-sm text-[var(--mist)]">{plan.description}</p>
                <ul className="mt-4 flex-1 divide-y divide-[var(--edge)] text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 py-2.5">
                      <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--marquee)]/15 text-xs text-[var(--marquee)]">✓</span>
                      <span className={/^tout /i.test(f) ? "font-semibold" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isCurrent}
                  onClick={() => setSelected(plan)}
                  className={`mt-6 rounded-md px-4 py-3.5 font-semibold transition-colors disabled:cursor-default ${
                    isCurrent
                      ? "bg-white/5 text-[var(--mist)]"
                      : plan.highlight || isUpgrade
                        ? "bg-[var(--marquee)] text-[#1a1203] hover:bg-[#f7c766]"
                        : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {cta}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Tableau comparatif */}
      <div className="mt-16">
        <h3 className="text-xl font-bold">Comparer les offres</h3>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--edge)]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-[var(--deep)]">
              <tr>
                <th scope="col" className="px-5 py-4 font-medium text-[var(--mist)]">Avantages</th>
                {PLANS.map((p) => (
                  <th key={p.name} scope="col" className={`px-5 py-4 text-center font-bold ${p.highlight ? "text-[var(--marquee)]" : ""}`}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--edge)]">
              <tr>
                <th scope="row" className="px-5 py-3.5 font-medium">Qualité vidéo</th>
                {table.quality.map((q, i) => <td key={i} className="px-5 py-3.5 text-center">{q}</td>)}
              </tr>
              <tr>
                <th scope="row" className="px-5 py-3.5 font-medium">Écrans simultanés</th>
                {table.screens.map((s, i) => <td key={i} className="px-5 py-3.5 text-center">{s}</td>)}
              </tr>
              {table.features.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="px-5 py-3.5 font-medium">{row.label}</th>
                  {row.included.map((ok, i) => (
                    <td key={i} className="px-5 py-3.5 text-center">
                      {ok ? <span className="text-[var(--marquee)]" aria-label="Inclus">✓</span> : <span className="text-[var(--mist)]/50" aria-label="Non inclus">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <CheckoutModal
          plan={selected}
          period={period}
          currentId={current?.id}
          currentMonthly={current ? monthlyEquivalent(current.price, current.billingPeriod) : undefined}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
