"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewsApi } from "@/components/reviews/api";
import { LIVE_STATUSES } from "@/modules/subscriptions/subscription.constants";
import type { SubscriptionDto } from "@/modules/subscriptions/subscription.service";
import { Modal } from "./ui";

// Résilier un abonnement en cours, ou supprimer un abonnement terminé de son historique
export default function SubscriptionActions({
  subscription,
  afterDelete,
  showChangePlan = false,
}: {
  subscription: SubscriptionDto;
  afterDelete?: string; // page vers laquelle revenir après suppression
  showChangePlan?: boolean;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const live = LIVE_STATUSES.includes(subscription.status);

  async function run() {
    setBusy(true);
    setError(null);
    const { error } =
      confirm === "cancel"
        ? await reviewsApi(`/api/subscriptions/${subscription.id}`, "PATCH", { action: "cancel" })
        : await reviewsApi(`/api/subscriptions/${subscription.id}`, "DELETE");
    setBusy(false);
    if (error) return setError(error);
    const wasDelete = confirm === "delete";
    setConfirm(null);
    if (wasDelete && afterDelete) router.push(afterDelete);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {live && showChangePlan && (
          <a href="#offres" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700">
            Changer d&apos;offre
          </a>
        )}
        {live ? (
          <button
            onClick={() => setConfirm("cancel")}
            className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10"
          >
            Résilier
          </button>
        ) : (
          <button
            onClick={() => setConfirm("delete")}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-red-300"
          >
            🗑️ Supprimer de l&apos;historique
          </button>
        )}
      </div>

      {confirm && (
        <Modal title={confirm === "cancel" ? "Résilier l'abonnement" : "Supprimer l'abonnement"} onClose={() => setConfirm(null)}>
          <p className="text-sm text-slate-300">
            {confirm === "cancel" ? (
              <>
                Votre abonnement <strong className="text-white">{subscription.planName}</strong> sera résilié dès
                maintenant. Vous pourrez souscrire à nouveau à tout moment.
              </>
            ) : (
              <>
                L&apos;abonnement <strong className="text-white">{subscription.planName}</strong> sera définitivement retiré
                de l&apos;historique. Cette action est irréversible.
              </>
            )}
          </p>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={() => setConfirm(null)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">
              Retour
            </button>
            <button onClick={run} disabled={busy} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
              {busy ? "…" : confirm === "cancel" ? "Confirmer la résiliation" : "Supprimer"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
