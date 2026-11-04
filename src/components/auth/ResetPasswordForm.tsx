"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // Récupère le jeton sécurisé du mail

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

      setMessage("Mot de passe mis à jour ! Redirection vers la page de connexion...");
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
      <div className="w-full max-w-md mx-auto p-6 bg-slate-900 rounded-2xl border border-slate-800 text-center text-white">
        <p className="text-red-400 font-bold">Jeton de sécurité manquant.</p>
        <Link href="/login" className="mt-4 inline-block text-blue-400 underline">Retour</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900 rounded-2xl shadow-lg border border-slate-800 text-white">
      <h1 className="text-2xl font-bold text-center">Nouveau mot de passe</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-300">
            Nouveau mot de passe (8 caractères min)
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-300">
            Confirmez le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
        {message && <p className="text-sm text-green-400 font-medium">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Validation..." : "Réinitialiser le mot de passe"}
        </button>
      </form>
    </div>
  );
}
