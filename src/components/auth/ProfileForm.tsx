"use client";

import { useActionState, startTransition, useState } from "react";
import { updateProfile, changePassword, toggleSubscription } from "@/actions/userActions";
import type { ProfileUser } from "@/types/user";

// 💡 AJOUT DE IS_SUBSCRIBED DANS LES PROPS DU COMPOSANT
export default function ProfileForm({ user, isSubscribed }: { user: ProfileUser; isSubscribed: boolean }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, { error: null, success: null });
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, { error: null, success: null });

  // 💡 GESTION LOCALE POUR LE SYSTÈME DE PUSH ABONNEMENT EN TEMPS RÉEL
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
      if (result.error) {
        setSubError(result.error);
      } else if (result.success) {
        setSubMessage(result.success);
      }
    });
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto p-2 text-[var(--text-primary)]">

      {/* SECTION 1 : INFORMATIONS GÉNÉRALES */}
      <form action={profileAction} className="space-y-5 rounded-[22px] bg-[var(--surface)] p-8 shadow-xl border border-[var(--surface-variant)] transition-colors">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-[var(--accent)] mb-2">
          Informations personnelles
        </h2>

        <div>
          <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Adresse e-mail (Non modifiable)
          </label>
          <input
            value={user.email}
            disabled
            className="w-full rounded-xl border border-[var(--surface-variant)] bg-[var(--background)] p-3.5 opacity-50 text-sm text-[var(--text-primary)] transition-colors"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Nom d’utilisateur
          </label>
          <input
            id="username"
            name="username"
            defaultValue={user.username}
            required
            autoComplete="off"
            className="w-full rounded-xl border border-[var(--surface-variant)] bg-[var(--background)] p-3.5 text-sm focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={profilePending}
          className="py-3 px-6 bg-[var(--accent)] text-[var(--background)] text-xs font-bold rounded-xl disabled:opacity-50 transition-all active:scale-95 shadow-md hover:brightness-110 uppercase tracking-wider cursor-pointer"
        >
          {profilePending ? "Mise à jour..." : "Enregistrer les modifications"}
        </button>

        {profileState.error && <p className="text-xs text-amber-600 font-semibold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">{profileState.error}</p>}
        {profileState.success && <p className="text-xs text-emerald-500 font-semibold bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">{profileState.success}</p>}
      </form>

      {/* 💡 SECTION INTERMÉDIAIRE 2 : GESTION DE L'ABONNEMENT STREAMING (CONFORME FIGMA) */}
      <div className="space-y-5 rounded-[22px] bg-[var(--surface)] p-8 shadow-xl border border-[var(--surface-variant)] transition-colors">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-[var(--accent)] mb-2">
          Gestion de l'abonnement Streaming
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">
          {isSubscribed
            ? "Vous profitez actuellement de l'accès Premium illimité CINEA. Vous pouvez explorer l'intégralité du catalogue TMDB en haute définition."
            : "Votre abonnement est suspendu. Vous naviguez en compte Cinéphile standard. Réabonnez-vous pour réactiver les accès complets aux flux vidéos."}
        </p>

        <button
          onClick={handleSubscriptionClick}
          disabled={subPending}
          className={`py-3 px-6 text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm uppercase tracking-wider cursor-pointer border ${
            isSubscribed
              ? "bg-transparent text-amber-600 border-amber-600/30 hover:bg-amber-500/5"
              : "bg-[var(--accent-light)] text-[#1B1B19] border-transparent hover:brightness-105"
          }`}
        >
          {subPending ? "Traitement..." : isSubscribed ? "Résilier mon accès Premium" : "Réactiver mon accès Premium ✨"}
        </button>

        {subError && <p className="text-xs text-amber-600 font-semibold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 mt-2">{subError}</p>}
        {subMessage && <p className="text-xs text-emerald-500 font-semibold bg-green-500/10 p-3 rounded-xl border border-green-500/20 mt-2">{subMessage}</p>}
      </div>

      {/* SECTION 3 : SÉCURITÉ & MOT DE PASSE */}
      <form action={passwordAction} className="space-y-5 rounded-[22px] bg-[var(--surface)] p-8 shadow-xl border border-[var(--surface-variant)] transition-colors">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-2">
          Sécurité du compte
        </h2>

        <div>
          <label htmlFor="currentPassword" className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Mot de passe actuel
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            className="w-full rounded-xl border border-[var(--surface-variant)] bg-[var(--background)] p-3.5 text-sm focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-colors"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Nouveau mot de passe
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            className="w-full rounded-xl border border-[var(--surface-variant)] bg-[var(--background)] p-3.5 text-sm focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={passwordPending}
          className="py-3 px-6 bg-transparent text-[var(--accent)] border border-[var(--accent)] text-xs font-bold rounded-xl disabled:opacity-50 transition-all active:scale-95 shadow-sm hover:bg-[var(--surface-variant)] uppercase tracking-wider cursor-pointer"
        >
          {passwordPending ? "Modification..." : "Modifier le mot de passe"}
        </button>

        {passwordState.error && <p className="text-xs text-amber-500 font-semibold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">{passwordState.error}</p>}
        {passwordState.success && <p className="text-xs text-emerald-500 font-semibold bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">{passwordState.success}</p>}
      </form>
    </div>
  );
}
