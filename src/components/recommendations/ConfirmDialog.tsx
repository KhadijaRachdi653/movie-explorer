"use client";

import Dialog from "./Dialog";
import { btnDanger, btnQuiet } from "./ui";

export default function ConfirmDialog({
  open, title, message, confirmLabel, onConfirm, onClose,
}: {
  open: boolean; title: string; message: string; confirmLabel: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="confirm-title">
      <div className="space-y-4 p-5">
        <h2 id="confirm-title" className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-[var(--mist)]">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" className={btnQuiet} onClick={onClose}>Annuler</button>
          <button type="button" className={btnDanger} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </Dialog>
  );
}
