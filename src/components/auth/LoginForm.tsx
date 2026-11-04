"use client";

import { useState, type FormEvent, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 💡 SÉCURITÉ : Vider les champs si l'utilisateur est déconnecté du système
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
        setError("Identifiants incorrects ou compte non validé.");
        setPassword(""); // 💡 Vide le champ mot de passe après un échec
        return;
      }

      // 💡 Succès : vider les états avant de changer de page
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
    <div className="w-full max-w-md mx-auto p-6 bg-slate-900 rounded-2xl shadow-lg border border-slate-800 text-white">
      <h2 className="text-2xl font-bold text-center text-slate-100 mb-6">Connexion</h2>

      {registered && (
        <p className="mb-4 text-sm p-3 bg-green-500/20 text-green-400 rounded-lg text-center font-medium">
          ✓ Inscription réussie ! Vérifiez vos e-mails pour activer votre compte.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Adresse e-mail</label>
          <input
            id="email"
             type="email"
             required
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             autoComplete="off" // 💡 Bloque le pré-remplissage historique du navigateur
             spellCheck="false"
             className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
             placeholder="exemple@esprit.tn"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">Mot de passe</label>
            <Link href="/forgot-password" className="text-xs text-blue-400 hover:underline">Mot de passe oublié ?</Link>
          </div>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password" // 💡 Force le navigateur à vider ce champ après déconnexion
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-400 font-medium">{error}</p>}

        <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg disabled:opacity-50">
          {loading ? "Vérification..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
