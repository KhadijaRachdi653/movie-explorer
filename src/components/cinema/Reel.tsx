// Bobine de film qui tourne (indicateur de chargement)
export default function Reel({ size = 72 }: { size?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 100 100" width={size} height={size} className="reel-spin">
      <circle cx="50" cy="50" r="46" fill="var(--marquee)" />
      <circle cx="50" cy="50" r="8" fill="var(--night)" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={50 + Math.cos((a * Math.PI) / 180) * 27} cy={50 + Math.sin((a * Math.PI) / 180) * 27} r="9.5" fill="var(--night)" />
      ))}
    </svg>
  );
}
