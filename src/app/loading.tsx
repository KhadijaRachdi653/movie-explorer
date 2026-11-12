import Reel from "@/components/cinema/Reel";

// Affiché pendant le chargement des pages qui lisent leurs données côté serveur
export default function Loading() {
  return (
    <div role="status" className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-5">
      <Reel size={64} />
      <p className="text-sm tracking-[0.25em] text-[var(--mist)]">CHARGEMENT</p>
    </div>
  );
}
