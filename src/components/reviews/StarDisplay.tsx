function StarIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" className="shrink-0">
      <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5z" />
    </svg>
  );
}

function Row({ size, className }: { size: number; className: string }) {
  return (
    <span className={`flex ${className}`} style={{ width: size * 5 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarIcon key={i} size={size} />
      ))}
    </span>
  );
}

// Read-only stars, supports decimals (e.g. 3.7 fills 74% of the row).
export default function StarDisplay({ value, size = 16 }: { value: number; size?: number }) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  return (
    <span
      role="img"
      aria-label={`${value} sur 5`}
      className="relative inline-flex"
      style={{ width: size * 5, height: size }}
    >
      <Row size={size} className="text-slate-700" />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <Row size={size} className="text-amber-400" />
      </span>
    </span>
  );
}