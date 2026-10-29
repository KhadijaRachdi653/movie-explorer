"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { verifyUserCredentials } from "@/actions/userActions";

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
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Connexion
      </h2>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Adresse e-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="exemple@esprit.tn"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-600 hover:underline font-medium transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex flex-col gap-2 transition-all">
            <span className="font-medium">{state.error}</span>

            {state.error.includes("créer un compte") && (
              <Link
                href="/register"
                className="mt-1 text-center font-semibold text-blue-600 hover:text-blue-800 underline transition-colors"
              >
                Créer un compte maintenant ➡️
              </Link>
            )}
          </div>
        )}

        {state?.isValid && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm font-medium text-center">
            Connexion réussie ! Redirection...
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {isPending ? "Vérification en cours..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-4 text-sm text-center text-gray-600">
        Nouveau sur Movie Explorer ?{" "}
        <Link href="/register" className="text-blue-600 hover:underline font-medium">
          S'inscrire
        </Link>
      </p>
    </div>
  );
}
