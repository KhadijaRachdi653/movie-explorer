"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useAppTheme } from "./ThemeProvider";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useAppTheme();

  return (
    <nav className="sticky top-0 z-50 border-b bg-[var(--surface)] border-[var(--border-subtle)] p-4 transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between">

        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-wider select-none">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--text-primary)] text-[var(--background)] text-xs font-black transition-colors">▶</span>
          <span className="text-[var(--accent)] font-black tracking-widest">CINEA</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/" className={`text-xs font-bold uppercase tracking-wider transition-colors ${pathname === "/" ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>Accueil</Link>
          <Link href="/movies" className={`text-xs font-bold uppercase tracking-wider transition-colors ${pathname === "/movies" ? "text-[var(--accent)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>Catalogue</Link>

          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] hover:bg-[var(--surface-variant)] text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            {isDark ? "☀️ Clair" : "🌙 Sombre"}
          </button>

          {session?.user ? (
            <>
              <Link href="/profile" className={`text-xs font-bold uppercase tracking-wider transition-colors ${pathname === "/profile" ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>{session.user.name}</Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-xl bg-[var(--background)] border border-[var(--border-subtle)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--surface-variant)] transition-all cursor-pointer">Déconnexion</button>
            </>
          ) : (
            <>
              <Link href="/login" className={`text-xs font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${pathname === "/login" ? "bg-[var(--accent-light)] text-[#1B1B19]" : "text-[var(--text-primary)] hover:bg-[var(--background)]"}`}>Connexion</Link>
              <Link href="/register" className={`text-xs font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all ${pathname === "/register" ? "bg-[var(--accent-light)] text-[#1B1B19] border-transparent" : "hover:bg-[var(--background)]"}`}>Inscription</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
