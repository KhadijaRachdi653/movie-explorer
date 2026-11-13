"use client";

import { useState } from "react";

const SIZES = { sm: "text-sm", md: "text-xl", lg: "text-3xl" };
const LABELS = ["", "Mauvais", "Moyen", "Bien", "Très bien", "Chef-d'œuvre"];

// Affichage d'une note (demi-étoiles incluses)
export function StarDisplay({ value, size = "sm" }: { value: number; size?: keyof typeof SIZES }) {
  return (
    <span className={`relative inline-block leading-none ${SIZES[size]}`} aria-label={`${value} sur 5`}>
      <span className="text-slate-700">★★★★★</span>
      <span className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${(value / 5) * 100}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

// Sélecteur d'étoiles 1 à 5, avec survol et libellé
export function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (score: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label="Votre note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            disabled={disabled}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className={`px-0.5 text-3xl leading-none transition hover:scale-110 disabled:cursor-not-allowed ${
              n <= shown ? "text-amber-400" : "text-slate-700"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-sm text-slate-400">{LABELS[shown]}</span>
    </div>
  );
}
