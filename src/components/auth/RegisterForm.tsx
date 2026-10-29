"use client";

import { registerUser, type ActionState } from "@/actions/userActions";
import { useRouter } from "next/navigation";
import { useEffect, useActionState } from "react";

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
    <div className="w-full rounded-2xl bg-slate-900 p-6 shadow-lg text-white">
      <h1 className="text-2xl font-bold">Créer un compte</h1>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm mb-1">Nom complet</label>
          <input name="name" type="text" required className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm mb-1">Adresse e-mail</label>
          <input name="email" type="email" required className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm mb-1">Mot de passe</label>
          <input name="password" type="password" required className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white focus:outline-none" />
        </div>

        {state?.error && <p className="text-sm text-red-400 font-medium">{state.error}</p>}
        {state?.success && <p className="text-sm text-green-400 font-medium">{state.success}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold hover:bg-blue-700 transition disabled:bg-blue-800"
        >
          {isPending ? "Inscription en cours..." : "S'inscrire"}
        </button>
      </form>
    </div>
  );
}
