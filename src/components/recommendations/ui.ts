// Classes partagées (boutons, champs) du thème cinéma
const base =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const btnPrimary = `${base} bg-[var(--marquee)] text-[#1a1203] hover:bg-[#f7c766]`;
export const btnSecondary = `${base} bg-white/10 text-[var(--ink)] backdrop-blur hover:bg-white/20`;
export const btnQuiet = `${base} text-[var(--mist)] hover:bg-white/5 hover:text-[var(--ink)]`;
export const btnDanger = `${base} border border-[var(--danger)]/50 text-[var(--danger)] hover:bg-[var(--danger)]/10`;
export const field =
  "w-full rounded-md border border-[var(--edge)] bg-[var(--night)] px-3 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--mist)]/70 focus:border-[var(--marquee)] focus:outline-none";
