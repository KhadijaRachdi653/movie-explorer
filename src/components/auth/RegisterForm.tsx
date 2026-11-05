"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Erreur lors de l’inscription.");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Erreur de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-[var(--surface)] rounded-[22px] shadow-xl border border-[var(--surface-variant)] text-[var(--text-primary)] transition-all">
      <h1 className="text-3xl font-extrabold text-center tracking-tight mb-2 text-[var(--accent-light,#D7BC83)]">Créer un compte</h1>
      <p className="text-sm text-[var(--text-muted)] text-center mb-8 font-medium">Rejoignez la communauté CINEA</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="username" className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Nom d’utilisateur
          </label>
          <input
            id="username"
            type="text"
            required
            minLength={3}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--surface-variant)] rounded-xl focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-colors text-sm"
            placeholder="Khadija_R"
          />
        </div>

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
            placeholder="khadija.rachdi.kotbi@outlook.fr"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--surface-variant)] rounded-xl focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-colors text-sm"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-xs text-amber-600 font-semibold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[var(--accent-light,#D7BC83)] text-[#1B1B19] font-extrabold rounded-xl transition-transform active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider shadow-md hover:brightness-110 cursor-pointer"
        >
          {loading ? "Création du compte..." : "S’inscrire"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-[var(--text-muted)]">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-[var(--accent-light,#D7BC83)] font-bold hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
