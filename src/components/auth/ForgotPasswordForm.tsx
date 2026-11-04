"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }

      setMessage(data.message);
      setEmail(""); // 💡 VIDAGE DU CHAMP EMAIL après l'envoi réussi
    } catch {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900 rounded-2xl shadow-lg border border-slate-800 text-white">
      <h1 className="text-2xl font-bold text-center">Mot de passe oublié</h1>
      <p className="mt-2 text-sm text-slate-400 text-center">Saisissez votre adresse e-mail pour recevoir un lien d'activation sécurisé.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">Adresse e-mail</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white"
            placeholder="votre.nom@esprit.tn"
          />
        </div>

        {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
        {message && <p className="text-sm text-green-400 font-medium">{message}</p>}

        <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white disabled:opacity-50">
          {loading ? "Envoi en cours..." : "Envoyer le lien"}
        </button>
      </form>
    </div>
  );
}
