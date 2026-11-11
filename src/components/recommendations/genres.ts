// Genres TMDB (identifiants officiels) : nom court et titre de rangée
export const GENRES: Record<number, { name: string; row: string }> = {
  28: { name: "Action", row: "Films d’action pour vous" },
  12: { name: "Aventure", row: "Aventures pour vous" },
  16: { name: "Animation", row: "Films d’animation pour vous" },
  35: { name: "Comédie", row: "Comédies pour vous" },
  80: { name: "Policier", row: "Films policiers pour vous" },
  99: { name: "Documentaire", row: "Documentaires pour vous" },
  18: { name: "Drame", row: "Drames pour vous" },
  10751: { name: "Familial", row: "À voir en famille" },
  14: { name: "Fantastique", row: "Fantastique pour vous" },
  36: { name: "Histoire", row: "Films historiques pour vous" },
  27: { name: "Horreur", row: "Frissons pour vous" },
  10402: { name: "Musique", row: "Films musicaux pour vous" },
  9648: { name: "Mystère", row: "Mystères pour vous" },
  10749: { name: "Romance", row: "Romances pour vous" },
  878: { name: "Science-fiction", row: "Science-fiction pour vous" },
  10770: { name: "Téléfilm", row: "Téléfilms pour vous" },
  53: { name: "Thriller", row: "Thrillers pour vous" },
  10752: { name: "Guerre", row: "Films de guerre pour vous" },
  37: { name: "Western", row: "Westerns pour vous" },
};

export function genreNames(ids: number[], max = 3): string[] {
  return ids.map((id) => GENRES[id]?.name).filter((n): n is string => Boolean(n)).slice(0, max);
}
