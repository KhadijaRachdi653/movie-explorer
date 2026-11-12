"use client";

import { useActionState, startTransition, useState } from "react";
import { updateProfile, changePassword, toggleSubscription } from "@/actions/userActions";

export type ProfileUser = {
  id?: string;
  email: string;
  username: string;
  role?: string;
};

const card = "rounded-xl border border-[var(--edge)] bg-[var(--deep)] p-6 sm:p-8";
const field = "w-full rounded-md border border-[var(--edge)] bg-[var(--night)] px-4 py-3 text-[var(--ink)] transition-colors focus:border-[var(--marquee)] focus:outline-none";
const label = "mb-1.5 block text-sm font-medium text-[var(--ink)]/85";
const ok = "rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300";
const ko = "rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300";

// Profil (Module 1, Khadija) : informations, accès Premium, mot de passe
export default function ProfileForm({ user, isSubscribed }: { user: ProfileUser; isSubscribed: boolean }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, { error: null, success: null });
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, { error: null, success: null });

  // Accès Premium : état local mis à jour après l'appel serveur
  const [subMessage, setSubMessage] = useState<string | null>(null);
  const [subError, setSubError] = useState<string | null>(null);
  const [subPending, setSubPending] = useState(false);

  function handleSubscriptionClick(e: React.MouseEvent) {
    e.preventDefault();
    setSubMessage(null);
    setSubError(null);
    setSubPending(true);
    startTransition(async () => {
      const result = await toggleSubscription();
      setSubPending(false);
      if (result.error) setSubError(result.error);
      else if (result.success) setSubMessage(result.success);
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. Informations personnelles */}
      <form action={profileAction} className={`${card} space-y-5`} aria-labelledby="infos-title">
        <h2 id="infos-title" className="text-xl font-bold">Informations personnelles</h2>
        <div>
          <label htmlFor="profile-email" className={label}>Adresse e-mail</label>
          <input id="profile-email" value={user.email} disabled aria-describedby="email-help" className={`${field} cursor-not-allowed text-[var(--mist)]`} />
          <p id="email-help" className="mt-1.5 text-xs text-[var(--mist)]">L’adresse e-mail ne peut pas être modifiée.</p>
        </div>
        <div>
          <label htmlFor="username" className={label}>Nom d’utilisateur</label>
          <input id="username" name="username" defaultValue={user.username} required autoComplete="name" className={field} />
        </div>
        {profileState.error && <p role="alert" className={ko}>{profileState.error}</p>}
        {profileState.success && <p role="status" className={ok}>{profileState.success}</p>}
        <button type="submit" disabled={profilePending} className="rounded-md bg-[var(--marquee)] px-6 py-3 font-semibold text-[#1a1203] transition-colors hover:bg-[#f7c766] disabled:opacity-60">
          {profilePending ? "Mise à jour…" : "Enregistrer les modifications"}
        </button>
      </form>

      {/* 2. Accès Premium */}
      <section className={card} aria-labelledby="premium-title">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="premium-title" className="text-xl font-bold">Accès Premium</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isSubscribed ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-[var(--mist)]"}`}>
            {isSubscribed ? "Actif" : "Suspendu"}
          </span>
        </div>
        <p className="mt-2 text-sm text-[var(--mist)]">
          {isSubscribed
            ? "Vous profitez de l’accès Premium illimité. Vous pouvez explorer l’intégralité du catalogue."
            : "Votre accès Premium est suspendu : vous naviguez avec un compte standard. Réactivez-le pour retrouver tous les accès."}
        </p>
        <button
          type="button"
          onClick={handleSubscriptionClick}
          disabled={subPending}
          className={`mt-5 rounded-md px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
            isSubscribed ? "border border-[var(--edge)] text-[var(--ink)] hover:border-red-500/50 hover:text-red-300" : "bg-[var(--marquee)] text-[#1a1203] hover:bg-[#f7c766]"
          }`}
        >
          {subPending ? "Traitement…" : isSubscribed ? "Suspendre mon accès Premium" : "Réactiver mon accès Premium"}
        </button>
        {subError && <p role="alert" className={`mt-4 ${ko}`}>{subError}</p>}
        {subMessage && <p role="status" className={`mt-4 ${ok}`}>{subMessage}</p>}
      </section>

      {/* 3. Sécurité : mot de passe */}
      <form action={passwordAction} className={`${card} space-y-5`} aria-labelledby="password-title">
        <h2 id="password-title" className="text-xl font-bold">Sécurité du compte</h2>
        <div>
          <label htmlFor="currentPassword" className={label}>Mot de passe actuel</label>
          <input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" className={field} />
        </div>
        <div>
          <label htmlFor="newPassword" className={label}>Nouveau mot de passe</label>
          <input id="newPassword" name="newPassword" type="password" required autoComplete="new-password" className={field} />
        </div>
        {passwordState.error && <p role="alert" className={ko}>{passwordState.error}</p>}
        {passwordState.success && <p role="status" className={ok}>{passwordState.success}</p>}
        <button type="submit" disabled={passwordPending} className="rounded-md bg-white/10 px-6 py-3 font-semibold transition-colors hover:bg-white/20 disabled:opacity-60">
          {passwordPending ? "Modification…" : "Modifier le mot de passe"}
        </button>
      </form>
    </div>
  );
}
