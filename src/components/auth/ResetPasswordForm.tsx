"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Le lien a expiré ou est invalide.");
        return;
      }

      setMessage("Mot de passe mis à jour ! Redirection...");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-[var(--surface)] rounded-[22px] border border-amber-500/20 text-center text-[var(--text-primary)] shadow-xl">
        <p className="text-amber-600 font-bold mb-4">Jeton de sécurité manquant.</p>
        <Link href="/login" className="text-[var(--accent-light,#D7BC83)] font-bold underline">Retour à la connexion</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-[var(--surface)] rounded-[22px] shadow-xl border border-[var(--surface-variant)] text-[var(--text-primary)] transition-all">
      <h1 className="text-3xl font-extrabold text-center tracking-tight mb-2 text-[var(--accent-light,#D7BC83)]">Nouveau mot de passe</h1>
      <p className="text-sm text-[var(--text-muted)] text-center mb-8 font-medium">Définissez vos nouveaux paramètres d'accès</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Nouveau mot de passe (8 caractères min)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--surface-variant)] rounded-xl focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-colors text-sm"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Confirmez le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--surface-variant)] rounded-xl focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-colors text-sm"
          />
        </div>

        {error && <p className="text-xs text-amber-600 font-semibold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">{error}</p>}
        {message && <p className="text-xs text-green-500 font-semibold bg-green-500/10 p-3 rounded-xl border border-green-500/20">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[var(--accent-light,#D7BC83)] text-[#1B1B19] font-extrabold rounded-xl transition-transform active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider shadow-md hover:brightness-110 cursor-pointer"
        >
          {loading ? "Validation..." : "Réinitialiser le mot de passe"}
        </button>
      </form>
    </div>
  );
}
