"use client";

import { useState } from "react";
import { PLANS, formatPrice, monthlyEquivalent, planPrice, type BillingPeriod, type PlanDefinition } from "@/modules/subscriptions/subscription.constants";
import type { SubscriptionDto } from "@/modules/subscriptions/subscription.service";
import CheckoutModal from "./CheckoutModal";

// Grille des offres : souscrire, ou changer d'offre si un abonnement est en cours
export default function PlanGrid({ current }: { current: SubscriptionDto | null }) {
  const [period, setPeriod] = useState<BillingPeriod>(current?.billingPeriod ?? "monthly");
  const [selected, setSelected] = useState<PlanDefinition | null>(null);

  return (
    <section id="offres" className="scroll-mt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{current ? "Changer d'offre" : "Choisissez votre offre"}</h2>
          <p className="text-sm text-slate-400">Résiliable à tout moment. L&apos;annuel vous offre 2 mois.</p>
        </div>
        <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1 text-sm" role="tablist">
          {(["monthly", "yearly"] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={period === p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${period === p ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              {p === "monthly" ? "Mensuel" : "Annuel"}
              {p === "yearly" && <span className="ml-1.5 rounded bg-amber-400/20 px-1.5 text-[10px] font-bold text-amber-300">-17%</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const price = planPrice(plan, period);
          const isCurrent = current?.planName === plan.name && current.billingPeriod === period;
          const isUpgrade = current
            ? monthlyEquivalent(price, period) > monthlyEquivalent(current.price, current.billingPeriod)
            : false;
          const cta = !current ? "Choisir" : isCurrent ? "Offre actuelle" : isUpgrade ? "Passer à " + plan.name : "Rétrograder";

          return (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border bg-slate-900 p-5 transition ${
                isCurrent ? "border-emerald-500/50" : plan.highlight ? "border-blue-500/60 shadow-lg shadow-blue-900/30" : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {plan.highlight && !isCurrent && (
                <span className="absolute -top-2.5 left-5 rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-semibold">{plan.tagline}</span>
              )}
              {isCurrent && (
                <span className="absolute -top-2.5 left-5 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold">Votre offre</span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              {!plan.highlight && <p className="text-xs text-slate-500">{plan.tagline}</p>}
              <p className="mt-3">
                <span className="text-3xl font-extrabold">{price === 0 ? "0" : price.toLocaleString("fr-FR")}</span>
                <span className="ml-1 text-sm text-slate-400">TND / {period === "yearly" ? "an" : "mois"}</span>
              </p>
              {period === "yearly" && price > 0 && (
                <p className="text-xs text-amber-300">soit {formatPrice(Math.round((price / 12) * 100) / 100)} par mois</p>
              )}
              <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-emerald-400">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled={isCurrent}
                onClick={() => setSelected(plan)}
                className={`mt-5 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-default ${
                  isCurrent
                    ? "bg-slate-800 text-slate-400"
                    : plan.highlight || isUpgrade
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "border border-slate-700 hover:bg-slate-800"
                }`}
              >
                {cta}
              </button>
            </article>
          );
        })}
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
