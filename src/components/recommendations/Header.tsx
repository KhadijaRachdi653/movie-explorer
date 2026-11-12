"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStreaming } from "./context";

const links = [
  { href: "/", label: "Accueil", icon: "⌂" },
  { href: "/recommendations", label: "Pour vous", icon: "★" },
  { href: "/lists", label: "Mes listes", icon: "☰" },
];

export default function Header() {
  const pathname = usePathname();
  const { session } = useStreaming();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled
          ? "bg-[var(--night)]/95 shadow-lg shadow-black/30 backdrop-blur"
          : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <div className="flex h-16 items-center justify-between gap-6 px-4 sm:justify-start sm:px-8">
        <Link
          href="/"
          className="shrink-0 text-xl font-extrabold tracking-tight text-[var(--marquee)]"
        >
          Movie Explorer
        </Link>
        <nav
          aria-label="Navigation principale"
          className="hidden min-w-0 flex-1 gap-5 text-sm sm:flex"
        >
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
        {session.status === "user" ? (
          <Link
            href="/profile"
            aria-label="Mon profil"
            className="flex shrink-0 items-center gap-2 text-sm text-[var(--mist)] hover:text-[var(--ink)]"
          >
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-[var(--marquee)] font-bold text-[#1a1203]"
            >
              {session.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
            <span className="hidden max-w-32 truncate sm:inline">
              {session.name}
            </span>
          </Link>
        ) : session.status === "guest" ? (
          <Link
            href="/login"
            className="shrink-0 rounded-md bg-[var(--marquee)] px-3 py-1.5 text-sm font-semibold text-[#1a1203]"
          >
            Se connecter
          </Link>
        ) : null}
      </div>

      {/* Mobile : barre de navigation en bas, à portée de pouce */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[var(--edge)] bg-[var(--night)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-xs ${isActive(l.href) ? "font-semibold text-[var(--marquee)]" : "text-[var(--mist)]"}`}
          >
            <span aria-hidden className="text-lg leading-none">
              {l.icon}
            </span>
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
