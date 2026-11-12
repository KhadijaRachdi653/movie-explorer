"use client";

import Link from "next/link";
import { registerUser, type ActionState } from "@/actions/authActions";
import { useRouter } from "next/navigation";
import { useEffect, useActionState } from "react";
import { authButton, authField, authLabel, authLink } from "./authStyles";

const initialState: ActionState = { error: null, success: null };

export default function RegisterForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(registerUser, initialState);

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => router.push("/login"), 2000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  return (
    <div className="rounded-xl border border-[var(--edge)] bg-[var(--deep)]/90 p-7 shadow-2xl shadow-black/50 backdrop-blur sm:p-9">
      <h1 className="text-3xl font-extrabold tracking-tight">Créer un compte</h1>
      <p className="mt-2 text-[var(--mist)]">Rangez vos films dans des listes et recevez des suggestions sur mesure.</p>

      <form action={formAction} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className={authLabel}>Nom complet</label>
          <input id="name" name="name" type="text" required autoComplete="name" className={authField} placeholder="Votre nom" />
        </div>
        <div>
          <label htmlFor="email" className={authLabel}>Adresse e-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={authField} placeholder="exemple@esprit.tn" />
        </div>
        <div>
          <label htmlFor="password" className={authLabel}>Mot de passe</label>
          <input id="password" name="password" type="password" required autoComplete="new-password" aria-describedby="password-help" className={authField} placeholder="••••••••" />
          <p id="password-help" className="mt-1.5 text-xs text-[var(--mist)]">
            6 à 10 caractères, avec une majuscule, un chiffre et un caractère spécial.
          </p>
        </div>

        {state?.error && <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm font-medium text-red-300">{state.error}</p>}
        {state?.success && <p role="status" className="rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm font-medium text-green-300">{state.success}</p>}

        <button type="submit" disabled={isPending} className={authButton}>
          {isPending ? "Inscription en cours…" : "S’inscrire"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--mist)]">
        Déjà inscrit ? <Link href="/login" className={authLink}>Se connecter</Link>
      </p>
    </div>
  );
}
