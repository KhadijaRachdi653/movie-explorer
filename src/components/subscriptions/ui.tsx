import type { ReactNode } from "react";
import {
  PERIOD_LABELS,
  STATUS_LABELS,
  STATUS_STYLES,
  type BillingPeriod,
  type SubscriptionStatus,
} from "@/modules/subscriptions/subscription.constants";

// Éléments d'interface partagés par les écrans du Module 2 (même palette que le reste de l'application)

export const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500";

export const labelClass = "mb-1 block text-xs font-medium text-slate-400";

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PeriodBadge({ period }: { period: BillingPeriod }) {
  return (
    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">{PERIOD_LABELS[period]}</span>
  );
}

export function formatDate(iso: string | null, withYear = true): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}) });
}

// Date au format attendu par <input type="date">
export function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`max-h-[92vh] w-full ${wide ? "max-w-3xl" : "max-w-lg"} overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-2xl leading-none text-slate-400 hover:text-white">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
