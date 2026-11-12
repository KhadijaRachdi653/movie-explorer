"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { reviewsApi } from "@/components/reviews/api";
import {
  PERIOD_LABELS,
  formatPrice,
  monthlyEquivalent,
  planPrice,
  type BillingPeriod,
  type PlanDefinition,
} from "@/modules/subscriptions/subscription.constants";
import { Modal, inputClass, labelClass } from "./ui";

// Paiement SIMULÉ : les champs de carte sont vérifiés uniquement sur leur format, dans le navigateur.
// Rien de ce qui est saisi ici n'est envoyé au serveur : seuls l'offre et la période le sont.

type Card = { holder: string; number: string; expiry: string; cvc: string };
const emptyCard: Card = { holder: "", number: "", expiry: "", cvc: "" };
const TEST_CARD: Card = { holder: "CINEA DEMO", number: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" };

const formatNumber = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

function brandOf(number: string): string {
  const d = number.replace(/\D/g, "");
  if (d.startsWith("4")) return "VISA";
  if (/^5[1-5]/.test(d)) return "MASTERCARD";
  if (/^3[47]/.test(d)) return "AMEX";
  return "CARTE";
}

function validateCard(card: Card): string | null {
  if (card.holder.trim().length < 3) return "Indiquez le nom du titulaire.";
  if (card.number.replace(/\D/g, "").length !== 16) return "Le numéro de carte doit comporter 16 chiffres.";
  const [mm, yy] = card.expiry.split("/").map(Number);
  if (!mm || mm > 12 || yy === undefined || Number.isNaN(yy)) return "Date d'expiration invalide (MM/AA).";
  const now = new Date();
  if (2000 + yy < now.getFullYear() || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1)) {
    return "Cette carte est expirée.";
  }
  if (!/^\d{3}$/.test(card.cvc)) return "Le cryptogramme comporte 3 chiffres.";
  return null;
}

export default function CheckoutModal({
  plan,
  period,
  currentId,
  currentMonthly,
  onClose,
}: {
  plan: PlanDefinition;
  period: BillingPeriod;
  currentId?: string; // présent : changement d'offre de l'abonnement en cours
  currentMonthly?: number; // prix mensuel équivalent de l'offre actuelle
  onClose: () => void;
}) {
  const router = useRouter();
  const [card, setCard] = useState<Card>(emptyCard);
  const [flipped, setFlipped] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "done">("form");
  const [error, setError] = useState<string | null>(null);

  const price = planPrice(plan, period);
  const needsPayment = price > 0;
  const isChange = !!currentId;
  const isDowngrade = isChange && currentMonthly !== undefined && monthlyEquivalent(price, period) < currentMonthly;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (needsPayment) {
      const invalid = validateCard(card);
      if (invalid) return setError(invalid);
    }
    setStep("processing");
    // Petite attente pour simuler l'autorisation bancaire
    await new Promise((r) => setTimeout(r, needsPayment ? 1400 : 500));
    const { error } = isChange
      ? await reviewsApi(`/api/subscriptions/${currentId}`, "PATCH", { action: "change-plan", planName: plan.name, billingPeriod: period })
      : await reviewsApi("/api/subscriptions", "POST", { planName: plan.name, billingPeriod: period });
    if (error) {
      setStep("form");
      return setError(error);
    }
    setCard(emptyCard);
    setStep("done");
    router.refresh();
  }

  const set = (k: keyof Card, fmt?: (v: string) => string) => (e: { target: { value: string } }) =>
    setCard({ ...card, [k]: fmt ? fmt(e.target.value) : e.target.value });

  const title = isChange ? (isDowngrade ? `Passer à ${plan.name}` : `Passer à ${plan.name} ✨`) : `S'abonner à ${plan.name}`;

  if (step === "done") {
    return (
      <Modal title={title} onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-300">✓</div>
          <p className="text-lg font-semibold">{isChange ? "Offre modifiée !" : "Bienvenue dans CINEA " + plan.name + " !"}</p>
          <p className="text-sm text-slate-400">
            {plan.name} · {PERIOD_LABELS[period]} · {formatPrice(price)}
          </p>
          <button onClick={onClose} className="mt-3 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold hover:bg-blue-700">
            Terminer
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={title} onClose={step === "processing" ? () => {} : onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm">
          <span className="text-slate-300">
            {plan.name} · {PERIOD_LABELS[period]}
          </span>
          <span className="font-semibold">{formatPrice(price)}</span>
        </div>

        {needsPayment ? (
          <>
            {/* Aperçu de la carte, retourné quand on saisit le cryptogramme */}
            <div className="mx-auto h-44 w-full max-w-xs [perspective:1000px]">
              <div
                className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
              >
                <div className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 p-5 shadow-xl [backface-visibility:hidden]">
                  <div className="flex items-center justify-between">
                    <span className="h-7 w-10 rounded-md bg-gradient-to-br from-amber-200 to-amber-500" />
                    <span className="text-xs font-black tracking-widest">{brandOf(card.number)}</span>
                  </div>
                  <p className="font-mono text-lg tracking-widest">{card.number || "•••• •••• •••• ••••"}</p>
                  <div className="flex justify-between text-xs uppercase">
                    <span className="truncate pr-2">{card.holder || "NOM DU TITULAIRE"}</span>
                    <span>{card.expiry || "MM/AA"}</span>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div className="mt-6 h-9 bg-black/70" />
                  <div className="mx-5 mt-4 flex h-8 items-center justify-end rounded bg-slate-200 px-3 font-mono text-sm text-slate-900">
                    {card.cvc || "•••"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="cc-holder">Titulaire de la carte</label>
                <input id="cc-holder" className={inputClass} autoComplete="off" value={card.holder} onChange={set("holder", (v) => v.toUpperCase())} placeholder="NOM PRÉNOM" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="cc-number">Numéro de carte</label>
                <input id="cc-number" className={`${inputClass} font-mono`} autoComplete="off" inputMode="numeric" value={card.number} onChange={set("number", formatNumber)} placeholder="4242 4242 4242 4242" />
              </div>
              <div>
                <label className={labelClass} htmlFor="cc-expiry">Expiration</label>
                <input id="cc-expiry" className={`${inputClass} font-mono`} autoComplete="off" inputMode="numeric" value={card.expiry} onChange={set("expiry", formatExpiry)} placeholder="MM/AA" />
              </div>
              <div>
                <label className={labelClass} htmlFor="cc-cvc">Cryptogramme</label>
                <input
                  id="cc-cvc"
                  className={`${inputClass} font-mono`}
                  autoComplete="off"
                  inputMode="numeric"
                  value={card.cvc}
                  onChange={set("cvc", (v) => v.replace(/\D/g, "").slice(0, 3))}
                  onFocus={() => setFlipped(true)}
                  onBlur={() => setFlipped(false)}
                  placeholder="123"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
              <span>🧪 Mode démonstration : aucun débit, rien n&apos;est envoyé ni enregistré. N&apos;utilisez pas une vraie carte.</span>
              <button type="button" onClick={() => setCard(TEST_CARD)} className="rounded-lg border border-amber-500/40 px-2 py-1 font-medium hover:bg-amber-500/10">
                Carte de test
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            {isChange
              ? "Votre nouvelle offre démarre aujourd'hui. Aucun paiement n'est nécessaire."
              : "Cette offre est gratuite : aucun moyen de paiement n'est demandé."}
          </p>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={step === "processing"} className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50">
            Annuler
          </button>
          <button disabled={step === "processing"} className="min-w-36 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
            {step === "processing" ? "Traitement…" : needsPayment ? `Payer ${formatPrice(price)}` : "Confirmer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
