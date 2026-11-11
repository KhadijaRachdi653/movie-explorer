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
      setEmail("");
    } catch {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-[var(--surface)] rounded-[22px] shadow-xl border border-[var(--surface-variant)] text-[var(--text-primary)] transition-all">
      <h1 className="text-3xl font-extrabold text-center tracking-tight mb-2 text-[var(--accent-light,#D7BC83)]">Mot de passe oublié</h1>
      <p className="text-sm text-[var(--text-muted)] text-center mb-8 font-medium">Un lien de réinitialisation sécurisé vous sera envoyé.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--surface-variant)] rounded-xl focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-colors text-sm"
            placeholder="votre.nom@esprit.tn"
          />
        </div>

        {error && <p className="text-xs text-amber-600 font-semibold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">{error}</p>}
        {message && <p className="text-xs text-green-500 font-semibold bg-green-500/10 p-3 rounded-xl border border-green-500/20">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[var(--accent-light,#D7BC83)] text-[#1B1B19] font-extrabold rounded-xl transition-transform active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider shadow-md hover:brightness-110 cursor-pointer"
        >
          {loading ? "Envoi en cours..." : "Envoyer le lien"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-[var(--text-muted)]">
        <Link href="/login" className="text-[var(--accent-light,#D7BC83)] font-bold hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
