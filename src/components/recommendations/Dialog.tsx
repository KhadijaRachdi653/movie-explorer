"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Fenêtre modale basée sur <dialog> : focus piégé, Échap et clic à l'extérieur ferment
export default function Dialog({
  open,
  onClose,
  labelledBy,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={`mx-0 mb-0 mt-auto max-h-[92vh] w-full max-w-none overflow-hidden rounded-t-2xl border border-b-0 border-[var(--edge)] bg-[var(--deep)] p-0 text-[var(--ink)] shadow-2xl sm:m-auto sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:rounded-xl sm:border-b ${wide ? "sm:max-w-3xl" : "sm:max-w-md"}`}
    >
      {open && (
        <div className="max-h-[92vh] overflow-y-auto pb-[env(safe-area-inset-bottom)] sm:max-h-[90vh]">
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
          {children}
        </div>
      )}
    </dialog>
  );
}
