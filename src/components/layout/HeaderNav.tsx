"use client";

import Link from "next/link";
import { signOutUser } from "@/actions/userActions";

type HeaderNavProps = {
  userName: string | null;
};

export default function HeaderNav({ userName }: HeaderNavProps) {
  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm sm:gap-4" aria-label="Navigation principale">
      {userName ? (
        <>
          <Link href="/discover" className="text-slate-200 underline hover:text-white">Découvrir</Link>
          <Link href="/collection" className="text-slate-200 underline hover:text-white">Ma collection</Link>
          <span className="text-slate-400">
            Bonjour, <strong className="text-white">{userName}</strong> !
          </span>
          <Link href="/profile" className="text-slate-200 underline hover:text-white">Mon Profil</Link>
          <form action={signOutUser}>
            <button type="submit" className="rounded-md bg-red-600/80 px-3 py-1.5 text-white transition-colors hover:bg-red-700">
              Déconnexion
            </button>
          </form>
        </>
      ) : (
        <>
          <Link href="/discover" className="text-slate-200 hover:text-white">Découvrir</Link>
          <Link href="/login" className="text-slate-200 hover:text-white">Se connecter</Link>
          <Link href="/register" className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">Créer un compte</Link>
        </>
      )}
    </nav>
  );
}
