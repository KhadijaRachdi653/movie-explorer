"use client";

import { useState } from "react";
import type { CustomListDTO, Visibility } from "@/modules/recommendations/types";
import Dialog from "./Dialog";
import { useStreaming } from "./context";
import { btnPrimary, btnQuiet, field } from "./ui";

const visibilityOptions: { value: Visibility; label: string; hint: string }[] = [
  { value: "private", label: "Privée", hint: "Vous seule la voyez." },
  { value: "public", label: "Publique", hint: "Toute personne ayant le lien peut la voir." },
];

// Créer ou modifier une liste
export default function ListFormDialog({
  open,
  onClose,
  list,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  list?: CustomListDTO; // absent = création
  onSaved?: (list: CustomListDTO) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="list-form-title">
      {/* key : formulaire réinitialisé à chaque ouverture */}
      {open && <ListForm key={list?.id ?? "new"} list={list} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

function ListForm({ list, onClose, onSaved }: { list?: CustomListDTO; onClose: () => void; onSaved?: (l: CustomListDTO) => void }) {
  const { createList, updateList } = useStreaming();
  const [name, setName] = useState(list?.name ?? "");
  const [description, setDescription] = useState(list?.description ?? "");
  const [visibility, setVisibility] = useState<Visibility>(list?.visibility ?? "private");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const nameError = name.trim().length < 2 ? "Le nom doit contenir au moins 2 caractères." : null;

  async function submit() {
    setTouched(true);
    if (nameError) return;
    setSaving(true);
    const input = { name: name.trim(), description: description.trim(), visibility };
    const saved = list ? await updateList(list.id, input) : await createList(input);
    setSaving(false);
    if (saved) {
      onSaved?.(saved);
      onClose();
    }
  }

  return (
    <form className="space-y-5 p-5" onSubmit={(e) => { e.preventDefault(); void submit(); }} noValidate>
      <h2 id="list-form-title" className="text-lg font-bold">{list ? "Modifier la liste" : "Nouvelle liste"}</h2>

      <div className="space-y-1.5">
        <label htmlFor="list-name" className="text-sm font-medium">Nom</label>
        <input
          id="list-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched(true)}
          maxLength={50}
          placeholder="Ex. Soirée films d’horreur"
          aria-invalid={touched && !!nameError}
          aria-describedby="list-name-help"
          className={field}
          autoFocus
        />
        <p id="list-name-help" className={`text-xs ${touched && nameError ? "text-[var(--danger)]" : "text-[var(--mist)]"}`}>
          {touched && nameError ? nameError : `${name.trim().length}/50 caractères`}
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="list-description" className="text-sm font-medium">Description <span className="font-normal text-[var(--mist)]">(facultatif)</span></label>
        <textarea
          id="list-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="À quoi sert cette liste ?"
          className={`${field} resize-none`}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-medium">Qui peut la voir ?</legend>
        {visibilityOptions.map((o) => (
          <label
            key={o.value}
            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
              visibility === o.value ? "border-[var(--marquee)] bg-[var(--marquee)]/5" : "border-[var(--edge)] hover:border-[var(--mist)]"
            }`}
          >
            <input
              type="radio"
              name="visibility"
              value={o.value}
              checked={visibility === o.value}
              onChange={() => setVisibility(o.value)}
              className="mt-1 accent-[var(--marquee)]"
            />
            <span>
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="block text-xs text-[var(--mist)]">{o.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex justify-end gap-2">
        <button type="button" className={btnQuiet} onClick={onClose}>Annuler</button>
        <button className={btnPrimary} disabled={saving}>{saving ? "Enregistrement…" : list ? "Enregistrer" : "Créer la liste"}</button>
      </div>
    </form>
  );
}
