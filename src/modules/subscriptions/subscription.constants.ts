// Constantes du Module 2 (Abonnements), sans dépendance serveur : importables côté client comme côté serveur.
// Module pédagogique : les offres sont purement indicatives, elles ne débloquent aucune fonctionnalité.

export const BILLING_PERIODS = ["monthly", "yearly"] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

export const SUBSCRIPTION_STATUSES = ["active", "pending", "expired", "cancelled"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// Un abonnement « vivant » bloque la création d'un second abonnement pour le même utilisateur
export const LIVE_STATUSES: SubscriptionStatus[] = ["active", "pending"];

export const CURRENCY = "TND";

export interface PlanDefinition {
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number; // 10 mois facturés : 2 mois offerts
  features: string[];
  highlight?: boolean;
}

export const PLANS: PlanDefinition[] = [
  {
    name: "Basique",
    tagline: "Pour découvrir",
    description: "L'essentiel pour explorer le catalogue CINEA.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["Catalogue complet", "Notes et avis", "Watchlist et favoris"],
  },
  {
    name: "Premium",
    tagline: "Le plus populaire",
    description: "Pour les cinéphiles qui regardent chaque semaine.",
    monthlyPrice: 14.9,
    yearlyPrice: 149,
    features: ["Tout Basique", "Qualité HD", "2 écrans simultanés", "Sans publicité"],
    highlight: true,
  },
  {
    name: "Ultime",
    tagline: "L'expérience complète",
    description: "Le meilleur de CINEA, en famille.",
    monthlyPrice: 24.9,
    yearlyPrice: 249,
    features: ["Tout Premium", "Qualité 4K HDR", "4 écrans simultanés", "Avant-premières"],
  },
];

export const findPlan = (name: string) => PLANS.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());

export const planPrice = (plan: PlanDefinition, period: BillingPeriod) =>
  period === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

// Prix ramené au mois, pour comparer une offre mensuelle et une offre annuelle (upgrade ou downgrade)
export const monthlyEquivalent = (price: number, period: BillingPeriod) => (period === "yearly" ? price / 12 : price);

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Actif",
  pending: "En attente",
  expired: "Expiré",
  cancelled: "Résilié",
};

// Couleurs des pastilles de statut, dans la palette slate du reste de l'application
export const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  expired: "bg-slate-500/10 text-slate-400 border-slate-600",
  cancelled: "bg-red-500/10 text-red-300 border-red-500/30",
};

export const PERIOD_LABELS: Record<BillingPeriod, string> = {
  monthly: "Mensuel",
  yearly: "Annuel",
};

export function formatPrice(price: number): string {
  if (price === 0) return "Gratuit";
  return `${price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${CURRENCY}`;
}

// Fin de période : un mois ou un an après la date de début
export function addPeriod(start: Date, period: BillingPeriod): Date {
  const end = new Date(start);
  if (period === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}
