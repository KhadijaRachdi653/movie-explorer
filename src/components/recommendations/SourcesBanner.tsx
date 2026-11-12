import Link from "next/link";
import type { RecommendationSources } from "@/modules/recommendations/types";

// « Basé sur… » : chaque source vient d'une partie de l'équipe, avec un lien vers elle
export default function SourcesBanner({ basedOn }: { basedOn: RecommendationSources }) {
  const plural = (n: number, s: string, p = `${s}s`) => `${n} ${n > 1 ? p : s}`;
  const items = [
    { href: "/lists", count: basedOn.listFilms, label: plural(basedOn.listFilms, "film de vos listes", "films de vos listes"), module: "Mes listes" },
    { href: "/collection", count: basedOn.favorites, label: plural(basedOn.favorites, "favori"), module: "Ma collection" },
    { href: "/collection", count: basedOn.watchlist, label: plural(basedOn.watchlist, "film à voir ou en cours", "films à voir ou en cours"), module: "Ma collection" },
    { href: "/profile/ratings", count: basedOn.likedRatings, label: plural(basedOn.likedRatings, "film bien noté", "films bien notés"), module: "Notes et avis" },
    {
      href: "/discover",
      count: basedOn.savedSearchGenres.length,
      label: basedOn.savedSearchGenres.length > 0 ? `genres recherchés : ${basedOn.savedSearchGenres.slice(0, 3).join(", ")}` : "aucun genre recherché",
      module: "Recherches sauvegardées",
    },
  ];

  return (
    <section aria-labelledby="sources-title" className="mx-4 rounded-2xl border border-[var(--edge)] bg-[var(--deep)] p-5 sm:mx-8 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="sources-title" className="text-lg font-bold">Vos recommandations sont basées sur</h2>
        {basedOn.watched > 0 && (
          <p className="text-xs text-[var(--mist)]">{plural(basedOn.watched, "film déjà vu", "films déjà vus")} exclu{basedOn.watched > 1 ? "s" : ""}</p>
        )}
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((it) => (
          <li key={it.module + it.label}>
            <Link
              href={it.href}
              className={`flex h-full flex-col rounded-xl border p-3.5 transition-colors hover:border-[var(--marquee)] ${it.count > 0 ? "border-[var(--marquee)]/30 bg-[var(--marquee)]/5" : "border-[var(--edge)] opacity-70"}`}
            >
              <span className="text-xs font-semibold text-[var(--marquee)]">{it.module}</span>
              <span className="mt-1 text-sm">{it.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
