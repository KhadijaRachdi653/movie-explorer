"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

type SessionInfo = { status: "loading" | "guest" | "user"; name: string | null; isAdmin: boolean };

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/movies", label: "Films" },
  { href: "/discover", label: "Découvrir" },
  { href: "/recommendations", label: "Pour vous" },
  { href: "/lists", label: "Mes listes" },
];

// Pages qui ont déjà leur propre en-tête : on ne les modifie pas, on évite juste le doublon
const OWN_HEADER = [/^\/movies\/[^/]+\/reviews/, /^\/offline/];
// Pages à bannière (accueil, fiche film, Module 6) : l'en-tête se superpose à l'image
const OVERLAY = [/^\/$/, /^\/movies\/[^/]+$/, /^\/recommendations/, /^\/lists/];

/**
 * En-tête commun à toute la plateforme (thème cinéma).
 * Purement visuel : navigation, profil et déconnexion, aucune logique métier.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionInfo>({ status: "loading", name: null, isAdmin: false });
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { user?: { name?: string; role?: string } } | null) => {
        if (cancelled) return;
        const user = data?.user;
        setSession(user ? { status: "user", name: user.name ?? null, isAdmin: user.role === "admin" } : { status: "guest", name: null, isAdmin: false });
      })
      .catch(() => { if (!cancelled) setSession({ status: "guest", name: null, isAdmin: false }); });
    return () => { cancelled = true; };
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (OWN_HEADER.some((r) => r.test(pathname))) return null;

  const overlay = OVERLAY.some((r) => r.test(pathname));
  const links = session.isAdmin ? [...LINKS, { href: "/admin/movies", label: "Admin" }] : LINKS;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const solid = !overlay || scrolled || menuOpen;

  return (
    <header
      className={`${overlay ? "fixed" : "sticky"} inset-x-0 top-0 z-40 transition-colors duration-300 ${
        solid ? "bg-[var(--night)]/95 shadow-lg shadow-black/30 backdrop-blur" : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <div className="flex h-16 items-center justify-between gap-6 px-4 sm:px-8">
        <Link href="/" className="shrink-0 text-xl font-extrabold tracking-tight text-[var(--marquee)]">Movie Explorer</Link>

        <nav aria-label="Navigation principale" className="hidden min-w-0 flex-1 items-center gap-6 text-sm lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`shrink-0 py-1 transition-colors ${
                isActive(l.href)
                  ? "font-semibold text-[var(--ink)] underline decoration-[var(--marquee)] decoration-2 underline-offset-8"
                  : "text-[var(--mist)] hover:text-[var(--ink)]"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          {session.status === "user" ? (
            <>
              <Link href="/profile" className="flex items-center gap-2 text-sm text-[var(--mist)] hover:text-[var(--ink)]">
                <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-[var(--marquee)] font-bold text-[#1a1203]">
                  {session.name?.charAt(0).toUpperCase() ?? "?"}
                </span>
                <span className="max-w-36 truncate">{session.name}</span>
              </Link>
              <button type="button" onClick={() => void signOut({ redirectTo: "/" })} className="text-sm text-[var(--mist)] hover:text-[var(--ink)]">
                Déconnexion
              </button>
            </>
          ) : session.status === "guest" ? (
            <>
              <Link href="/register" className="text-sm text-[var(--mist)] hover:text-[var(--ink)]">Inscription</Link>
              <Link href="/login" className="rounded-md bg-[var(--marquee)] px-3.5 py-1.5 text-sm font-semibold text-[#1a1203] hover:bg-[#f7c766]">Se connecter</Link>
            </>
          ) : null}
        </div>

        {/* Mobile et tablette : menu déroulant (pas de barre en bas, pour ne pas couvrir CineBot) */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
          className="flex size-10 items-center justify-center rounded-md text-[var(--ink)] hover:bg-white/10 lg:hidden"
        >
          <span className="sr-only">{menuOpen ? "Fermer le menu" : "Ouvrir le menu"}</span>
          <span aria-hidden className="text-2xl leading-none">{menuOpen ? "×" : "≡"}</span>
        </button>
      </div>

      {menuOpen && (
        <nav id="menu-mobile" aria-label="Navigation principale" className="border-t border-[var(--edge)] px-4 pb-4 lg:hidden">
          <ul className="flex flex-col py-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`block rounded-md px-3 py-3 text-base ${isActive(l.href) ? "bg-white/5 font-semibold text-[var(--marquee)]" : "text-[var(--ink)] hover:bg-white/5"}`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-[var(--edge)] pt-4">
            {session.status === "user" ? (
              <>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex min-w-0 items-center gap-2 text-sm">
                  <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--marquee)] font-bold text-[#1a1203]">
                    {session.name?.charAt(0).toUpperCase() ?? "?"}
                  </span>
                  <span className="truncate">{session.name}</span>
                </Link>
                <button type="button" onClick={() => void signOut({ redirectTo: "/" })} className="shrink-0 text-sm text-[var(--mist)]">Déconnexion</button>
              </>
            ) : (
              <>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="text-sm text-[var(--mist)]">Inscription</Link>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="rounded-md bg-[var(--marquee)] px-3.5 py-2 text-sm font-semibold text-[#1a1203]">Se connecter</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
