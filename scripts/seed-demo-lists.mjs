// Données de démonstration du Module 6 (listes personnalisées) pour UN utilisateur.
//
//   node scripts/seed-demo-lists.mjs --email ton@email.tn          → aperçu, ne modifie rien
//   node scripts/seed-demo-lists.mjs --email ton@email.tn --yes    → supprime TES listes et crée les listes de démo
//
// La base est partagée par l'équipe : seules les listes de l'utilisateur indiqué sont touchées.
// Titres, affiches et genres viennent de TMDB (clé TMDB_API_KEY de .env.local).

import mongoose from "mongoose";

const DEMO_LISTS = [
  {
    name: "Mes films préférés",
    description: "Les films que je peux revoir sans jamais m’en lasser.",
    visibility: "public",
    movieIds: [27205, 157336, 155, 550, 807, 496243], // Inception, Interstellar, The Dark Knight, Fight Club, Seven, Parasite
  },
  {
    name: "Soirées en famille",
    description: "Des films à regarder avec les enfants.",
    visibility: "private",
    movieIds: [8587, 862, 12, 14160, 354912, 150540, 2062], // Le Roi Lion, Toy Story, Le Monde de Nemo, Là-haut, Coco, Vice-versa, Ratatouille
  },
  {
    name: "Grands classiques",
    description: "Les incontournables du cinéma.",
    visibility: "public",
    movieIds: [278, 238, 680, 13, 603], // Les Évadés, Le Parrain, Pulp Fiction, Forrest Gump, Matrix
  },
  {
    name: "Soirée romantique",
    description: "",
    visibility: "private",
    movieIds: [597, 313369, 194, 4348, 11036], // Titanic, La La Land, Amélie Poulain, Orgueil et Préjugés, N'oublie jamais
  },
  {
    name: "À voir ce week-end",
    description: "Les films que je veux regarder bientôt.",
    visibility: "private",
    movieIds: [],
  },
];

// ---------- Arguments et configuration ----------
const args = process.argv.slice(2);
const email = args[args.indexOf("--email") + 1];
const apply = args.includes("--yes");

if (!args.includes("--email") || !email || email.startsWith("--")) {
  console.error("Usage : node scripts/seed-demo-lists.mjs --email ton@email.tn [--yes]");
  process.exit(1);
}

try {
  process.loadEnvFile(".env.local");
} catch {
  console.error("Fichier .env.local introuvable : lance la commande à la racine du projet.");
  process.exit(1);
}
const { MONGODB_URI, TMDB_API_KEY } = process.env;
if (!MONGODB_URI || !TMDB_API_KEY) {
  console.error("MONGODB_URI et TMDB_API_KEY doivent être définis dans .env.local.");
  process.exit(1);
}

// ---------- TMDB ----------
async function fetchMovie(id) {
  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=fr-FR`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status} pour le film ${id}`);
  const m = await res.json();
  return { movieId: m.id, title: m.title, posterPath: m.poster_path ?? null, genreIds: (m.genres ?? []).map((g) => g.id) };
}

// ---------- Programme ----------
await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;

try {
  // E-mail comparé sans tenir compte des majuscules (il est enregistré tel que saisi à l'inscription)
  const escaped = email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const user = await db.collection("users").findOne({ email: { $regex: `^${escaped}$`, $options: "i" } });
  if (!user) {
    console.error(`Aucun utilisateur avec l’e-mail ${email}. Vérifie l’adresse utilisée pour te connecter.`);
    process.exitCode = 1;
  } else {
    const lists = db.collection("customLists");
    const existing = await lists.find({ userId: user._id }, { projection: { name: 1, movies: 1 } }).toArray();

    console.log(`\nUtilisateur : ${user.name ?? ""} <${user.email}>`);
    console.log(`Listes actuelles à supprimer (${existing.length}) :`);
    for (const l of existing) console.log(`  - ${l.name} (${l.movies?.length ?? 0} films)`);

    console.log("\nRécupération des films sur TMDB…");
    const now = Date.now();
    let minute = 0; // dates d'ajout décroissantes : le dernier film de la première liste est le plus récent
    const toCreate = [];
    for (const [i, def] of DEMO_LISTS.entries()) {
      const movies = [];
      for (const id of def.movieIds) {
        try {
          const movie = await fetchMovie(id);
          movies.push({ ...movie, addedAt: new Date(now - (DEMO_LISTS.length - i) * 86_400_000 + minute++ * 60_000) });
        } catch (err) {
          console.warn(`  ! film ${id} ignoré : ${err.message}`);
        }
      }
      const date = new Date(now - (DEMO_LISTS.length - i) * 86_400_000);
      toCreate.push({ userId: user._id, name: def.name, description: def.description, visibility: def.visibility, movies, createdAt: date, updatedAt: date });
    }

    console.log("\nListes de démonstration :");
    for (const l of toCreate) {
      console.log(`  + ${l.name} (${l.visibility === "public" ? "publique" : "privée"}, ${l.movies.length} films)`);
      for (const m of l.movies) console.log(`      ${m.movieId}  ${m.title}`);
    }

    if (!apply) {
      console.log("\nAperçu uniquement : rien n’a été modifié. Ajoute --yes pour appliquer.");
    } else {
      const { deletedCount } = await lists.deleteMany({ userId: user._id });
      await lists.insertMany(toCreate);
      console.log(`\nTerminé : ${deletedCount} liste(s) supprimée(s), ${toCreate.length} liste(s) créée(s).`);
    }
  }
} finally {
  await mongoose.disconnect();
}
