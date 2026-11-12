import { PLANS, type PlanDefinition } from "@/modules/subscriptions/subscription.constants";

// Habillage visuel de chaque offre (présentation uniquement)
export interface TierStyle {
  header: string; // fond de l'en-tête de la carte d'offre / de la carte de membre
  text: string; // couleur du texte sur cet en-tête
  ring: string; // contour
}

const STYLES: Record<string, TierStyle> = {
  basique: { header: "bg-[linear-gradient(135deg,#2c3a5c_0%,#141b2e_100%)]", text: "text-[var(--ink)]", ring: "ring-white/10" },
  premium: { header: "bg-[linear-gradient(135deg,#ffd682_0%,#f2b544_45%,#c98f1f_100%)]", text: "text-[#1a1203]", ring: "ring-[var(--marquee)]" },
  ultime: { header: "bg-[linear-gradient(135deg,#3a2a0c_0%,#120d05_55%,#000000_100%)]", text: "text-[#f7c766]", ring: "ring-[#c98f1f]/70" },
};

export function tierStyle(planName: string): TierStyle {
  return STYLES[planName.toLowerCase()] ?? STYLES.basique;
}

// Qualité et nombre d'écrans déduits des avantages de l'offre (ex. « Qualité 4K HDR », « 2 écrans simultanés »)
export function planQuality(plan: PlanDefinition): string | null {
  const f = plan.features.find((x) => /qualit/i.test(x));
  return f ? f.replace(/^qualit[ée]\s*/i, "") : null;
}
export function planScreens(plan: PlanDefinition): string | null {
  const f = plan.features.find((x) => /écran/i.test(x));
  return f ? f.match(/\d+/)?.[0] ?? null : null;
}

// Tableau comparatif : les avantages « Tout Basique », « Tout Premium » héritent de l'offre précédente
export function comparisonRows() {
  const own = (p: PlanDefinition) => p.features.filter((f) => !/^tout /i.test(f) && !/qualit|écran/i.test(f));
  const cumulative: string[][] = [];
  PLANS.forEach((p, i) => cumulative.push([...(i > 0 && p.features.some((f) => /^tout /i.test(f)) ? cumulative[i - 1] : []), ...own(p)]));
  const features = [...new Set(cumulative.flat())];
  return {
    quality: PLANS.map((p) => planQuality(p) ?? "—"),
    screens: PLANS.map((p) => planScreens(p) ?? "—"),
    features: features.map((f) => ({ label: f, included: cumulative.map((list) => list.includes(f)) })),
  };
}
