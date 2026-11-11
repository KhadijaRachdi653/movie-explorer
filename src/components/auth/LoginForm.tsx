"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { verifyUserCredentials } from "@/actions/authActions";

export default function LoginForm() {
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
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900 rounded-2xl shadow-lg border border-slate-800 text-white">
      <h2 className="text-2xl font-bold text-center text-white mb-6">
        Connexion
      </h2>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white focus:outline-none focus:border-blue-500"
            placeholder="exemple@esprit.tn"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-400 hover:underline font-medium transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white focus:outline-none focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <div className="p-3 bg-red-500/10 border border-red-500/40 text-red-300 rounded-lg text-sm flex flex-col gap-2 transition-all">
            <span className="font-medium">{state.error}</span>

            {state.error.includes("créer un compte") && (
              <Link
                href="/register"
                className="mt-1 text-center font-semibold text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                Créer un compte maintenant ➡️
              </Link>
            )}
          </div>
        )}

        {state?.isValid && (
          <div className="p-3 bg-green-500/10 border border-green-500/40 text-green-300 rounded-lg text-sm font-medium text-center">
            Connexion réussie ! Redirection...
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 transition disabled:bg-blue-800 disabled:cursor-not-allowed"
        >
          {isPending ? "Vérification en cours..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-4 text-sm text-center text-slate-400">
        Nouveau sur Movie Explorer ?{" "}
        <Link href="/register" className="text-blue-400 hover:underline font-medium">
          S'inscrire
        </Link>
      </p>
    </div>
  );
}
