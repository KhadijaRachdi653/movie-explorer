import Link from "next/link";
import FilmLeader from "@/components/cinema/FilmLeader";

export const metadata = { title: "Page introuvable" };

// 404 : remplace la page blanche par défaut de Next.js
export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <div aria-hidden className="absolute left-1/2 top-0 -z-10 h-[60vh] w-[120vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(242,181,68,0.12),transparent_60%)]" />
      <p aria-hidden className="select-none text-[clamp(6rem,22vw,14rem)] font-extrabold leading-none tracking-[-0.06em] text-transparent" style={{ WebkitTextStroke: "2px var(--marquee)" }}>
        404
      </p>
      <h1 className="mt-2 text-balance text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[0.95] tracking-[-0.035em]">
        Cette scène a été coupée au montage.
      </h1>
      <p className="mt-4 max-w-md text-lg text-[var(--ink)]/75">La page que vous cherchez n’existe pas, ou elle a changé d’adresse.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-md bg-[var(--marquee)] px-6 py-3 font-semibold text-[#1a1203] hover:bg-[#f7c766]">Retour à l’accueil</Link>
        <Link href="/movies" className="rounded-md bg-white/10 px-6 py-3 font-semibold hover:bg-white/20">Voir le catalogue</Link>
      </div>
      <div className="mt-14 opacity-60"><FilmLeader size={90} /></div>
    </main>
  );
}
