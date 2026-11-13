"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reviewsApi } from "@/components/reviews/api";
import {
  PLANS,
  STATUS_LABELS,
  SUBSCRIPTION_STATUSES,
  addPeriod,
  findPlan,
  formatPrice,
  planPrice,
  type BillingPeriod,
} from "@/modules/subscriptions/subscription.constants";
import type { SubscriptionDto } from "@/modules/subscriptions/subscription.service";
import SubscriptionFilters from "./SubscriptionFilters";
import { Modal, PeriodBadge, StatusBadge, formatDate, inputClass, labelClass, toDateInput } from "./ui";
import { Pagination, useSubscriptionList } from "./useSubscriptionList";

type Form = {
  userEmail: string;
  planName: string;
  description: string;
  price: string;
  billingPeriod: BillingPeriod;
  startDate: string;
  endDate: string;
  status: string;
};

function newForm(): Form {
  const start = new Date();
  const plan = PLANS[1];
  return {
    userEmail: "",
    planName: plan.name,
    description: plan.description,
    price: String(plan.monthlyPrice),
    billingPeriod: "monthly",
    startDate: toDateInput(start.toISOString()),
    endDate: toDateInput(addPeriod(start, "monthly").toISOString()),
    status: "active",
  };
}

const formFrom = (s: SubscriptionDto): Form => ({
  userEmail: s.user.email,
  planName: s.planName,
  description: s.description,
  price: String(s.price),
  billingPeriod: s.billingPeriod,
  startDate: toDateInput(s.startDate),
  endDate: toDateInput(s.endDate),
  status: s.status,
});

// Écran administrateur : liste filtrable de tous les abonnements + création, modification, suppression
export default function AdminSubscriptions({ reloadKey }: { reloadKey: unknown }) {
  const router = useRouter();
  const { filters, setFilters, page, setPage, data, loading, error } = useSubscriptionList("all", 10, reloadKey);
  const [form, setForm] = useState<Form | null>(null);
  const [editing, setEditing] = useState<SubscriptionDto | null>(null);
  const [toDelete, setToDelete] = useState<SubscriptionDto | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormError("");
    setForm(newForm());
  }

  function openEdit(s: SubscriptionDto) {
    setEditing(s);
    setFormError("");
    setForm(formFrom(s));
  }

  function close() {
    setForm(null);
    setEditing(null);
    setToDelete(null);
    setFormError("");
  }

  // Pré-remplit nom, description et prix à partir d'une offre du catalogue
  function applyPreset(name: string, period: BillingPeriod) {
    const plan = findPlan(name);
    if (!form || !plan) return;
    const start = form.startDate ? new Date(form.startDate) : new Date();
    setForm({
      ...form,
      planName: plan.name,
      description: plan.description,
      price: String(planPrice(plan, period)),
      billingPeriod: period,
      endDate: toDateInput(addPeriod(start, period).toISOString()),
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setFormError("");
    const payload = {
      planName: form.planName,
      description: form.description,
      price: form.price === "" ? undefined : Number(form.price),
      billingPeriod: form.billingPeriod,
      startDate: form.startDate,
      endDate: form.endDate || null,
      status: form.status,
    };
    const { error } = editing
      ? await reviewsApi(`/api/subscriptions/${editing.id}`, "PATCH", payload)
      : await reviewsApi("/api/subscriptions", "POST", { ...payload, userEmail: form.userEmail });
    setBusy(false);
    if (error) return setFormError(error);
    close();
    router.refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    const { error } = await reviewsApi(`/api/subscriptions/${toDelete.id}`, "DELETE");
    setBusy(false);
    if (error) return setFormError(error);
    close();
    router.refresh();
  }

  const set = (k: keyof Form) => (e: { target: { value: string } }) => form && setForm({ ...form, [k]: e.target.value });

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">{data ? `${data.total} abonnement(s) trouvé(s)` : "Chargement…"}</p>
        <button onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700">
          + Nouvel abonnement
        </button>
      </div>

      <SubscriptionFilters value={filters} onChange={setFilters} searchPlaceholder="Rechercher un nom, un e-mail, une offre…" />

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className={`mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-950 text-xs uppercase text-slate-400">
            <tr>
              <th className="p-3 pl-4">Abonné</th>
              <th className="p-3">Offre</th>
              <th className="p-3">Prix</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Début → Fin</th>
              <th className="p-3 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data?.subscriptions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  Aucun abonnement ne correspond à ces critères.
                </td>
              </tr>
            )}
            {data?.subscriptions.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-slate-950/40">
                <td className="p-3 pl-4">
                  <p className="font-medium">{s.user.name}</p>
                  <p className="text-xs text-slate-400">{s.user.email}</p>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.planName}</span>
                    <PeriodBadge period={s.billingPeriod} />
                  </div>
                </td>
                <td className="p-3 font-medium">{formatPrice(s.price)}</td>
                <td className="p-3">
                  <StatusBadge status={s.status} />
                </td>
                <td className="p-3 text-xs text-slate-400">
                  {formatDate(s.startDate)} → {formatDate(s.endDate)}
                </td>
                <td className="p-3 pr-4">
                  <div className="flex justify-end gap-1">
                    <Link href={`/subscriptions/${s.id}`} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white" title="Détail">
                      👁️
                    </Link>
                    <button onClick={() => openEdit(s)} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white" title="Modifier">
                      ✏️
                    </button>
                    <button onClick={() => setToDelete(s)} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-red-400" title="Supprimer">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={page} totalPages={data.totalPages} onPage={setPage} />}

      {form && (
        <Modal title={editing ? "Modifier l'abonnement" : "Nouvel abonnement"} onClose={close}>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="sub-email">E-mail de l&apos;abonné</label>
              <input
                id="sub-email"
                type="email"
                className={`${inputClass} ${editing ? "cursor-not-allowed opacity-60" : ""}`}
                value={form.userEmail}
                onChange={set("userEmail")}
                disabled={!!editing}
                required
                placeholder="utilisateur@exemple.com"
              />
            </div>

            <div className="sm:col-span-2">
              <span className={labelClass}>Remplir depuis une offre du catalogue</span>
              <div className="flex flex-wrap gap-2">
                {PLANS.map((p) => (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => applyPreset(p.name, form.billingPeriod)}
                    className={`rounded-lg border px-3 py-1 text-xs ${form.planName === p.name ? "border-blue-500 bg-blue-600/20 text-blue-200" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="sub-plan">Nom de l&apos;offre</label>
              <input id="sub-plan" className={inputClass} value={form.planName} onChange={set("planName")} required minLength={2} maxLength={50} />
            </div>
            <div>
              <label className={labelClass} htmlFor="sub-price">Prix (TND)</label>
              <input id="sub-price" type="number" min={0} step="0.01" className={inputClass} value={form.price} onChange={set("price")} required />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="sub-desc">Description (facultative)</label>
              <textarea id="sub-desc" rows={2} maxLength={300} className={inputClass} value={form.description} onChange={set("description")} />
            </div>
            <div>
              <label className={labelClass} htmlFor="sub-period">Période</label>
              <select
                id="sub-period"
                className={inputClass}
                value={form.billingPeriod}
                onChange={(e) =>
                  findPlan(form.planName)
                    ? applyPreset(form.planName, e.target.value as BillingPeriod)
                    : setForm({ ...form, billingPeriod: e.target.value as BillingPeriod })
                }
              >
                <option value="monthly">Mensuel</option>
                <option value="yearly">Annuel</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="sub-status">Statut</label>
              <select id="sub-status" className={inputClass} value={form.status} onChange={set("status")}>
                {SUBSCRIPTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="sub-start">Date de début</label>
              <input id="sub-start" type="date" className={inputClass} value={form.startDate} onChange={set("startDate")} required />
            </div>
            <div>
              <label className={labelClass} htmlFor="sub-end">Date de fin (facultative)</label>
              <input id="sub-end" type="date" className={inputClass} value={form.endDate} onChange={set("endDate")} />
            </div>
            <p className="text-xs text-slate-500 sm:col-span-2">
              Un statut « Actif » ou « En attente » est ajusté aux dates : début futur → en attente, fin passée → expiré.
            </p>
            {formError && <p className="text-sm text-red-400 sm:col-span-2">{formError}</p>}
            <div className="mt-2 flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={close} className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">
                Annuler
              </button>
              <button disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                {busy ? "…" : editing ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <Modal title="Supprimer l'abonnement" onClose={close}>
          <p className="text-sm text-slate-300">
            Supprimer l&apos;abonnement <strong className="text-white">{toDelete.planName}</strong> de{" "}
            <strong className="text-white">{toDelete.user.name}</strong> ? Cette action est irréversible.
          </p>
          {formError && <p className="mt-3 text-sm text-red-400">{formError}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={close} className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">
              Annuler
            </button>
            <button onClick={confirmDelete} disabled={busy} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
