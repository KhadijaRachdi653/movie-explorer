"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { verifyUserCredentials } from "@/actions/authActions";
import { authButton, authField, authLabel, authLink } from "./authStyles";

// registered / activated : messages après l'inscription et l'activation par e-mail (Module 1, Khadija)
export default function LoginForm({ registered = false, activated = false }: { registered?: boolean; activated?: boolean }) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(verifyUserCredentials, {
    error: null,
    isValid: null,
  });

  useEffect(() => {
    if (state?.isValid) {
      router.push("/");
      router.refresh();
    }
  }, [state?.isValid, router]);

  return (
    <div className="rounded-xl border border-[var(--edge)] bg-[var(--deep)]/90 p-7 shadow-2xl shadow-black/50 backdrop-blur sm:p-9">
      <h1 className="text-3xl font-extrabold tracking-tight">Bon retour parmi nous</h1>
      <p className="mt-2 text-[var(--mist)]">Connectez-vous pour retrouver vos listes et vos recommandations.</p>

      {registered && (
        <p role="status" className="mt-6 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm font-medium text-green-300">
          ✓ Inscription réussie ! Activez votre compte grâce à l’e-mail qui vient de vous être envoyé.
        </p>
      )}
      {activated && (
        <p role="status" className="mt-6 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm font-medium text-green-300">
          ✓ Votre compte est activé. Vous pouvez vous connecter.
        </p>
      )}

      <form action={formAction} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className={authLabel}>Adresse e-mail</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={authField} placeholder="exemple@esprit.tn" />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-[var(--ink)]/85">Mot de passe</label>
            <Link href="/forgot-password" className="text-xs font-medium text-[var(--marquee)] hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <input id="password" name="password" type="password" required autoComplete="current-password" className={authField} placeholder="••••••••" />
        </div>

        {state?.error && (
          <div role="alert" className="flex flex-col gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            <span className="font-medium">{state.error}</span>
            {state.error.includes("créer un compte") && (
              <Link href="/register" className={authLink}>Créer un compte maintenant</Link>
            )}
          </div>
        )}

        {state?.isValid && (
          <div role="status" className="rounded-md border border-green-500/40 bg-green-500/10 p-3 text-center text-sm font-medium text-green-300">
            Connexion réussie ! Redirection…
          </div>
        )}

        <button type="submit" disabled={isPending} className={authButton}>
          {isPending ? "Vérification en cours…" : "Se connecter"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--mist)]">
        Nouveau sur Movie Explorer ? <Link href="/register" className={authLink}>Créer un compte</Link>
      </p>
    </div>
  );
}
