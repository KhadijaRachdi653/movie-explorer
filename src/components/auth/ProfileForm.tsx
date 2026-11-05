"use client";

import { useActionState } from "react";
import { updateProfile, changePassword } from "@/actions/userActions";
import type { ProfileUser } from "@/types/user";

export default function ProfileForm({ user }: { user: ProfileUser }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, { error: null, success: null });
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, { error: null, success: null });

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

      {/* SECTION 2 : SÉCURITÉ & MOT DE PASSE */}
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
