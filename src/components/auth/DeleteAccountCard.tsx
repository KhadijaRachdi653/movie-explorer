"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { deleteAccount } from "@/actions/authActions";

// Suppression du compte (Module 1) : confirmation, puis déconnexion
export default function DeleteAccountCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm("Supprimer définitivement votre compte ? Cette action est irréversible.")) return;
    setLoading(true);
    setError(null);
    const res = await deleteAccount();
    if (res?.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    await signOut({ redirectTo: "/" });
  }

  return (
    <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-6" aria-labelledby="danger-title">
      <h2 id="danger-title" className="text-lg font-bold text-red-300">Supprimer mon compte</h2>
      <p className="mt-1 text-sm text-[var(--mist)]">La suppression est immédiate et irréversible.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={loading}
        className="mt-4 w-full rounded-md border border-red-500/50 px-4 py-3 font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
      >
        {loading ? "Suppression…" : "Supprimer définitivement mon compte"}
      </button>
    </section>
  );
}
