"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetUserPassword } from "@/actions/userActions";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetUserPassword, {
    error: null,
    success: null,
  });

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl bg-slate-900 p-6 shadow-lg border border-slate-800 mt-12 text-white">
      <h1 className="text-2xl font-bold">Réinitialiser le mot de passe</h1>
      <p className="mt-2 text-sm text-slate-400">
        Saisissez votre e-mail ainsi que votre nouveau mot de passe pour mettre à jour vos accès de sécurité.
      </p>

      {}
      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-slate-300">
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="exemple@esprit.tn"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {}
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-slate-300">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {state?.error && <p className="text-sm text-red-400 font-medium">{state.error}</p>}
        {state?.success && <p className="text-sm text-green-400 font-medium">{state.success}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          {isPending ? "Mise à jour en cours..." : "Changer le mot de passe"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-slate-400">
        <Link href="/login" className="text-blue-500 hover:underline font-medium">
          ⬅️ Retourner à la page de connexion
        </Link>
      </p>
    </div>
  );
}
