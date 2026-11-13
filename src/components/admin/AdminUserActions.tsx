"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminDeleteUser, adminUpdateUser } from "@/actions/userActions";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  valide: boolean;
};

const btn =
  "px-4 py-2 rounded-xl font-bold text-xs border transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";
const field =
  "w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--text-primary)]";
const label = "mb-1 block text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]";

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6 text-left text-[var(--text-primary)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-2xl leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditForm({ user, isSelf, onDone }: { user: AdminUserRow; isSelf: boolean; onDone: () => void }) {
  const [state, action, pending] = useActionState(adminUpdateUser.bind(null, user.id), { error: null, success: null });

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor={`name-${user.id}`} className={label}>Nom</label>
        <input id={`name-${user.id}`} name="name" defaultValue={user.name} required minLength={3} className={field} />
      </div>
      <div>
        <label htmlFor={`email-${user.id}`} className={label}>Adresse e-mail</label>
        <input id={`email-${user.id}`} name="email" type="email" defaultValue={user.email} required className={field} />
      </div>
      <div>
        <label htmlFor={`role-${user.id}`} className={label}>Rôle</label>
        <select id={`role-${user.id}`} name="role" defaultValue={user.role} disabled={isSelf} className={field}>
          <option value="user">Utilisateur</option>
          <option value="admin">Administrateur</option>
        </select>
        {/* Un champ désactivé n'est pas envoyé : on transmet la valeur actuelle */}
        {isSelf && <input type="hidden" name="role" value={user.role} />}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="valide" defaultChecked={user.valide} disabled={isSelf} />
        Compte validé
        {isSelf && <input type="hidden" name="valide" value="on" />}
      </label>
      {isSelf && <p className="text-xs text-[var(--text-muted)]">Vous ne pouvez pas modifier votre propre rôle ni bloquer votre compte.</p>}

      {state.error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-400">{state.error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} className={`${btn} border-[var(--border-subtle)] bg-[var(--background)] text-[var(--text-primary)] hover:bg-[var(--surface-variant)]`}>
          Annuler
        </button>
        <button type="submit" disabled={pending} className={`${btn} border-transparent bg-[var(--accent)] text-[var(--background)] hover:brightness-110`}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

// Boutons « Modifier » et « Supprimer » d'un compte, pour la liste et la fiche utilisateur
export default function AdminUserActions({
  user,
  isSelf,
  redirectAfterDelete,
}: {
  user: AdminUserRow;
  isSelf: boolean;
  redirectAfterDelete?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<"edit" | "delete" | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();
  const close = () => {
    setOpen(null);
    setDeleteError(null);
  };

  function confirmDelete() {
    startDelete(async () => {
      const res = await adminDeleteUser(user.id);
      if (res.error) return setDeleteError(res.error);
      close();
      if (redirectAfterDelete) router.push(redirectAfterDelete);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen("edit")}
        className={`${btn} border-[var(--border-subtle)] bg-[var(--background)] text-[var(--text-primary)] hover:bg-[var(--surface-variant)]`}
      >
        Modifier
      </button>
      <button
        type="button"
        onClick={() => setOpen("delete")}
        disabled={isSelf}
        title={isSelf ? "Vous ne pouvez pas supprimer votre propre compte ici" : undefined}
        className={`${btn} border-red-500/40 bg-transparent text-red-400 hover:bg-red-500/10`}
      >
        Supprimer
      </button>

      {open === "edit" && (
        <Dialog title={`Modifier ${user.name}`} onClose={close}>
          <EditForm user={user} isSelf={isSelf} onDone={close} />
        </Dialog>
      )}

      {open === "delete" && (
        <Dialog title="Supprimer le compte" onClose={close}>
          <p className="text-sm text-[var(--text-muted)]">
            Supprimer définitivement le compte de <strong className="text-[var(--text-primary)]">{user.name}</strong> ({user.email}) ?
            Cette action est irréversible.
          </p>
          {deleteError && <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-400">{deleteError}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={close} className={`${btn} border-[var(--border-subtle)] bg-[var(--background)] text-[var(--text-primary)] hover:bg-[var(--surface-variant)]`}>
              Annuler
            </button>
            <button type="button" onClick={confirmDelete} disabled={deleting} className={`${btn} border-transparent bg-red-600 text-white hover:bg-red-700`}>
              {deleting ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
