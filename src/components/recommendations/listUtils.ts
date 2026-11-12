import type { CustomListDTO } from "@/modules/recommendations/types";

// Genres les plus présents dans une liste
export function listTopGenres(list: CustomListDTO, max = 2): string[] {
  const count = new Map<string, number>();
  for (const m of list.movies)
    for (const g of m.genres) count.set(g, (count.get(g) ?? 0) + 1);
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([g]) => g);
}

const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

// « aujourd'hui », « hier », « il y a 3 jours », « il y a 2 mois »…
export function relativeDate(iso: string): string {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), "month");
  return rtf.format(Math.round(days / 365), "year");
}

export function filmCount(n: number): string {
  return n === 0 ? "Aucun film" : `${n} film${n > 1 ? "s" : ""}`;
}
