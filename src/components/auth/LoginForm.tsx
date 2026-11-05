"use client";

import { useState, type FormEvent, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const activated = searchParams.get("activated");
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      setEmail("");
      setPassword("");
    }
  }, [status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Identifiants incorrects ou compte en attente de validation.");
        setPassword("");
        return;
      }

      setEmail("");
      setPassword("");
      router.push("/");
      router.refresh();
    } catch {
      setError("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-[var(--surface)] rounded-[22px] shadow-xl border border-[var(--border-subtle)] text-[var(--text-primary)] transition-all">
      <h2 className="text-3xl font-extrabold text-center tracking-tight mb-2 text-[var(--accent)]">Connexion</h2>
      <p className="text-sm text-[var(--text-muted)] text-center mb-8 font-medium">Ravi de vous revoir sur CINEA</p>

      {registered && (
        <p className="mb-6 text-xs p-3 bg-green-500/10 text-green-500 rounded-xl text-center font-semibold border border-green-500/20">
          ✓ Inscription réussie ! activez votre compte via l'e-mail de test.
        </p>
      )}

      {activated && (
        <p className="mb-6 text-xs p-3 bg-teal-500/10 text-teal-500 rounded-xl text-center font-semibold border border-teal-500/20">
          ✓ Votre adresse e-mail a été validée ! Vous pouvez vous connecter.
        </p>
      )}

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
            spellCheck="false"
            className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-sm transition-colors"
            placeholder="exemple@esprit.tn"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
              Mot de passe
            </label>
            <Link href="/forgot-password" className="text-xs text-[var(--accent)] font-bold hover:underline">
              Oublié ?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full px-4 py-3.5 bg-[var(--background)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-sm transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-xs text-amber-600 font-semibold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[var(--accent-light)] text-[#1B1B19] font-extrabold rounded-xl transition-transform active:scale-95 disabled:opacity-50 text-xs uppercase tracking-wider shadow-md hover:brightness-105 cursor-pointer"
        >
          {loading ? "Vérification..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-[var(--text-muted)]">
        Nouveau sur CINEA ?{" "}
        <Link href="/register" className="text-[var(--accent)] font-bold hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
