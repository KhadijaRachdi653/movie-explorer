/* eslint-disable @next/next/no-img-element -- images TMDB externes, sans configuration next/image */

// Affiche de film, avec une alternative lisible si l'image manque
export default function Poster({ src, title, className = "" }: { src: string | null | undefined; title: string; className?: string }) {
  if (!src) {
    return (
      <div className={`flex aspect-[2/3] items-end bg-gradient-to-br from-[var(--raised)] to-[var(--deep)] p-3 ${className}`}>
        <span className="line-clamp-3 text-sm font-semibold leading-tight text-[var(--mist)]">{title}</span>
      </div>
    );
  }
  return <img src={src} alt={`Affiche de ${title}`} loading="lazy" className={`aspect-[2/3] w-full object-cover ${className}`} />;
}
