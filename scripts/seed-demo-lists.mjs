// Données de démonstration du Module 6 (listes personnalisées) pour UN utilisateur.
//
//   node scripts/seed-demo-lists.mjs --email ton@email.tn          → aperçu, ne modifie rien
//   node scripts/seed-demo-lists.mjs --email ton@email.tn --yes    → supprime TES listes et crée les listes de démo
//
// La base est partagée par l'équipe : seules les listes de l'utilisateur indiqué sont touchées.
// Les films sont choisis dans le catalogue (collection `movies`, Module 2) selon leurs genres, année et note.

import mongoose from "mongoose";
import { pathToFileURL } from "node:url";

const hasGenre = (...names) => (m) => (m.genres ?? []).some((g) => names.includes(g));
const noGenre = (...names) => (m) => !(m.genres ?? []).some((g) => names.includes(g));
const ADULT = ["Horreur", "Guerre", "Crime", "Thriller"]; // jamais dans une liste familiale ou romantique

// Ordre de tri : d'abord `prefer` (plus petit = mieux), puis la note
const byRating = (a, b) => (b.rating ?? 0) - (a.rating ?? 0);

// `order` = ordre de remplissage : les listes à thème d'abord, pour qu'elles gardent leurs films
// (un film n'apparaît que dans une liste). L'affichage garde l'ordre ci-dessous.
const DEMO_LISTS = [
  {
    name: "Mes films préférés",
    description: "Les films que je peux revoir sans jamais m’en lasser.",
    visibility: "public",
    count: 6,
    order: 4, // en dernier : les meilleurs films restants, tous genres confondus
    pick: () => true,
  },
  {
    name: "Soirées en famille",
    description: "Des films à regarder avec les enfants.",
    visibility: "private",
    count: 7,
    order: 1,
    // Familial (sans genre adulte), ou animation tout public (ni genre adulte, ni action)
    pick: (m) => noGenre(...ADULT)(m) && (hasGenre("Familial")(m) || (hasGenre("Animation")(m) && noGenre("Action")(m))),
    prefer: (m) => (hasGenre("Familial")(m) ? 0 : 1),
  },
  {
    name: "Grands classiques",
    description: "Les incontournables du cinéma.",
    visibility: "public",
    count: 5,
    order: 2,
    pick: (m) => m.year > 0 && m.year < 1995 && noGenre("Animation")(m),
  },
  {
    name: "Soirée romantique",
    description: "Pour une soirée en amoureux.",
    visibility: "private",
    count: 5,
    order: 3,
    pick: (m) => hasGenre("Romance")(m) && noGenre(...ADULT, "Action", "Science-Fiction", "Animation")(m),
    prefer: (m) => (m.genres ?? []).length, // moins de genres = film d'abord romantique
  },
  { name: "À voir ce week-end", description: "Les films que je veux regarder bientôt.", visibility: "private", count: 0, order: 5, pick: () => false },
];

/** Choisit les films de chaque liste dans le catalogue (fonction pure, sans base de données). */
export function chooseMovies(catalogue, lists = DEMO_LISTS) {
  const used = new Set();
  const chosen = new Map();
  for (const def of [...lists].sort((a, b) => a.order - b.order)) {
    const candidates = catalogue
      .filter((m) => !used.has(m._id.toString()) && def.pick(m))
      .sort((a, b) => (def.prefer ? def.prefer(a) - def.prefer(b) : 0) || byRating(a, b))
      .slice(0, def.count);
    candidates.forEach((m) => used.add(m._id.toString()));
    chosen.set(def.name, candidates);
  }
  return chosen;
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) await main();

async function main() {
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
const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error("MONGODB_URI doit être défini dans .env.local.");
  process.exit(1);
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

    const catalogue = await db.collection("movies").find({}, { projection: { title: 1, genres: 1, year: 1, rating: 1 } }).toArray();
    const selection = chooseMovies(catalogue);
    const now = Date.now();
    let minute = 0; // dates d'ajout décroissantes : le dernier film de la première liste est le plus récent
    const toCreate = [];
    for (const [i, def] of DEMO_LISTS.entries()) {
      const chosen = selection.get(def.name) ?? [];
      if (chosen.length < def.count) console.warn(`  ! « ${def.name} » : ${chosen.length} film(s) trouvé(s) sur ${def.count} dans le catalogue.`);
      const movies = chosen.map((m) => ({
        movieId: m._id.toString(),
        title: m.title, // pour l'aperçu seulement : seul movieId est enregistré
        genres: m.genres,
        addedAt: new Date(now - (DEMO_LISTS.length - i) * 86_400_000 + minute++ * 60_000),
      }));
      const date = new Date(now - (DEMO_LISTS.length - i) * 86_400_000);
      toCreate.push({ userId: user._id, name: def.name, description: def.description, visibility: def.visibility, movies, createdAt: date, updatedAt: date });
    }

    console.log("\nListes de démonstration :");
    for (const l of toCreate) {
      console.log(`  + ${l.name} (${l.visibility === "public" ? "publique" : "privée"}, ${l.movies.length} films)`);
      for (const m of l.movies) console.log(`      ${m.movieId}  ${m.title}  (${m.genres?.join(", ") ?? ""})`);
    }

    if (!apply) {
      console.log("\nAperçu uniquement : rien n’a été modifié. Ajoute --yes pour appliquer.");
    } else {
      const { deletedCount } = await lists.deleteMany({ userId: user._id });
      // Seul l'identifiant du catalogue est enregistré (titre, affiche et genres sont relus dans le catalogue)
      await lists.insertMany(toCreate.map((l) => ({ ...l, movies: l.movies.map(({ movieId, addedAt }) => ({ movieId, addedAt })) })));
      console.log(`\nTerminé : ${deletedCount} liste(s) supprimée(s), ${toCreate.length} liste(s) créée(s).`);
    }
  }
} finally {
  await mongoose.disconnect();
}
}
