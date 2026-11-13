// Genres du catalogue (noms en français) : titre de rangée, sinon « <Genre> pour vous »
const ROWS: Record<string, string> = {
  Action: "Films d’action pour vous",
  Aventure: "Aventures pour vous",
  Animation: "Films d’animation pour vous",
  Comédie: "Comédies pour vous",
  Crime: "Films policiers pour vous",
  Documentaire: "Documentaires pour vous",
  Drame: "Drames pour vous",
  Familial: "À voir en famille",
  Fantastique: "Fantastique pour vous",
  Histoire: "Films historiques pour vous",
  Horreur: "Frissons pour vous",
  Musique: "Films musicaux pour vous",
  Mystère: "Mystères pour vous",
  Romance: "Romances pour vous",
  "Science-Fiction": "Science-fiction pour vous",
  Téléfilm: "Téléfilms pour vous",
  Thriller: "Thrillers pour vous",
  Guerre: "Films de guerre pour vous",
  Western: "Westerns pour vous",
};

export function genreRow(genre: string): string {
  return ROWS[genre] ?? `${genre} pour vous`;
}

export function genreNames(genres: string[], max = 3): string[] {
  return genres.slice(0, max);
}
