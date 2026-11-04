"use client";

import { useActionState } from "react";
import { updateProfile, changePassword } from "@/actions/userActions";
import type { ProfileUser } from "@/types/user";

export default function ProfileForm({ user }: { user: ProfileUser }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, { error: null, success: null });
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, { error: null, success: null });

  return (
    <div className="space-y-8 text-white max-w-2xl mx-auto p-4">
      {/* SECTION 1 : INFORMATIONS GÉNÉRALES */}
      <form action={profileAction} className="space-y-4 rounded-xl bg-slate-900 p-6">
        <h2 className="text-xl font-bold text-blue-400 mb-2">Informations personnelles</h2>
        <div>
          <label className="mb-1 block text-sm text-slate-400">Adresse e-mail (Non modifiable)</label>
          <input value={user.email} disabled className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 opacity-60" />
        </div>
        <div>
          <label htmlFor="username" className="mb-1 block text-sm">Nom d’utilisateur</label>
          <input id="username" name="username" defaultValue={user.username} required className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3" />
        </div>
        <button type="submit" disabled={profilePending} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold disabled:opacity-50">
          {profilePending ? "Mise à jour..." : "Enregistrer les modifications"}
        </button>
        {profileState.error && <p className="text-sm text-red-400">{profileState.error}</p>}
        {profileState.success && <p className="text-sm text-green-400">{profileState.success}</p>}
      </form>

      {/* SECTION 2 : SÉCURITÉ & MOT DE PASSE */}
      <form action={passwordAction} className="space-y-4 rounded-xl bg-slate-900 p-6 border border-slate-800">
        <h2 className="text-xl font-bold text-red-400 mb-2">Sécurité du compte</h2>
        <div>
          <label htmlFor="currentPassword" className="mb-1 block text-sm">Mot de passe actuel</label>
          <input id="currentPassword" name="currentPassword" type="password" required className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3" />
        </div>
        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm">Nouveau mot de passe</label>
          <input id="newPassword" name="newPassword" type="password" required className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3" />
        </div>
        <button type="submit" disabled={passwordPending} className="rounded-lg bg-red-600 px-4 py-2 font-semibold disabled:opacity-50">
          {passwordPending ? "Modification..." : "Modifier le mot de passe"}
        </button>
        {passwordState.error && <p className="text-sm text-red-400">{passwordState.error}</p>}
        {passwordState.success && <p className="text-sm text-green-400">{passwordState.success}</p>}
      </form>
    </div>
  );
}
