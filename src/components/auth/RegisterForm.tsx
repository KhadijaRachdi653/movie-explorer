"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authButton, authField, authLabel, authLink } from "./authStyles";

// Inscription (Module 1, Khadija) : /api/auth/register crée le compte et envoie l'e-mail d'activation
export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Une erreur est survenue lors de l'inscription.");
        return;
      }
      router.push("/login?registered=true");
    } catch {
      setError("Pas de connexion. Vérifiez votre réseau puis réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--edge)] bg-[var(--deep)]/90 p-7 shadow-2xl shadow-black/50 backdrop-blur sm:p-9">
      <h1 className="text-3xl font-extrabold tracking-tight">Créer un compte</h1>
      <p className="mt-2 text-[var(--mist)]">Rangez vos films dans des listes et recevez des suggestions sur mesure.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="name" className={authLabel}>Nom complet</label>
          <input id="name" type="text" required autoComplete="name" value={username} onChange={(e) => setUsername(e.target.value)} className={authField} placeholder="Votre nom" />
        </div>
        <div>
          <label htmlFor="email" className={authLabel}>Adresse e-mail</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={authField} placeholder="exemple@esprit.tn" />
        </div>
        <div>
          <label htmlFor="password" className={authLabel}>Mot de passe</label>
          <input id="password" type="password" required autoComplete="new-password" aria-describedby="password-help" value={password} onChange={(e) => setPassword(e.target.value)} className={authField} placeholder="••••••••" />
          <p id="password-help" className="mt-1.5 text-xs text-[var(--mist)]">
            6 à 10 caractères, avec une majuscule, un chiffre et un caractère spécial.
          </p>
        </div>

        {error && <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm font-medium text-red-300">{error}</p>}

        <button type="submit" disabled={loading} className={authButton}>
          {loading ? "Inscription en cours…" : "S’inscrire"}
        </button>
        <p className="text-center text-xs text-[var(--mist)]">Un e-mail d’activation vous sera envoyé.</p>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--mist)]">
        Déjà inscrit ? <Link href="/login" className={authLink}>Se connecter</Link>
      </p>
    </div>
  );
}
