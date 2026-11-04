"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation"; // 💡 AJOUT POUR DÉTECTER LA ROUTE ACTUELLE

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname(); // Récupère l'adresse actuelle (ex: "/login" ou "/register")

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900 p-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-400">
          Movie Explorer
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/" className={`text-sm ${pathname === "/" ? "text-blue-400 font-bold" : "text-slate-300 hover:text-white"}`}>Accueil</Link>
          <Link href="/movies" className={`text-sm ${pathname === "/movies" ? "text-blue-400 font-bold" : "text-slate-300 hover:text-white"}`}>Catalogue</Link>
          <Link href="/search" className={`text-sm ${pathname === "/search" ? "text-blue-400 font-bold" : "text-slate-300 hover:text-white"}`}>Recherche</Link>

          {session?.user ? (
            <>
              <Link href="/profile" className={`text-sm ${pathname === "/profile" ? "text-blue-400 font-bold" : "text-slate-300"}`}>{session.user.name}</Link>
              <button onClick={() => signOut()} className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 transition-colors">Déconnexion</button>
            </>
          ) : (
            <>
              {/* 💡 SÉLECTION DYNAMIQUE : Connexion s'allume en bleu si on est sur /login */}
              <Link
                href="/login"
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === "/login"
                    ? "bg-blue-600 font-semibold text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Connexion
              </Link>

              {/* 💡 SÉLECTION DYNAMIQUE : Inscription s'allume en bleu uniquement si on est sur /register, sinon reste discret */}
              <Link
                href="/register"
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === "/register"
                    ? "bg-blue-600 font-semibold text-white"
                    : "border border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
