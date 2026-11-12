// Données de démonstration du Module 6 (listes personnalisées) pour UN utilisateur.
//
//   node scripts/seed-demo-lists.mjs --email ton@email.tn          → aperçu, ne modifie rien
//   node scripts/seed-demo-lists.mjs --email ton@email.tn --yes    → supprime TES listes et crée les listes de démo
//
// La base est partagée par l'équipe : seules les listes de l'utilisateur indiqué sont touchées.
// Les films sont choisis dans le catalogue (collection `movies`, Module 2) selon leurs genres, année et note.

import mongoose from "mongoose";

const hasGenre = (...names) => (m) => (m.genres ?? []).some((g) => names.includes(g));
const DEMO_LISTS = [
  { name: "Mes films préférés", description: "Les films que je peux revoir sans jamais m’en lasser.", visibility: "public", pick: () => true, count: 6 },
  { name: "Soirées en famille", description: "Des films à regarder avec les enfants.", visibility: "private", pick: hasGenre("Animation", "Familial"), count: 7 },
  { name: "Grands classiques", description: "Les incontournables du cinéma.", visibility: "public", pick: (m) => m.year > 0 && m.year < 1995, count: 5 },
  { name: "Soirée romantique", description: "", visibility: "private", pick: hasGenre("Romance"), count: 5 },
  { name: "À voir ce week-end", description: "Les films que je veux regarder bientôt.", visibility: "private", pick: () => false, count: 0 },
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

    // Les mieux notés d'abord ; un film n'apparaît que dans une liste
    const catalogue = await db.collection("movies").find({}, { projection: { title: 1, genres: 1, year: 1, rating: 1 } }).sort({ rating: -1 }).toArray();
    const used = new Set();
    const now = Date.now();
    let minute = 0; // dates d'ajout décroissantes : le dernier film de la première liste est le plus récent
    const toCreate = [];
    for (const [i, def] of DEMO_LISTS.entries()) {
      const chosen = catalogue.filter((m) => !used.has(m._id.toString()) && def.pick(m)).slice(0, def.count);
      chosen.forEach((m) => used.add(m._id.toString()));
      const movies = chosen.map((m) => ({
        movieId: m._id.toString(),
        title: m.title, // pour l'aperçu seulement : seul movieId est enregistré
        addedAt: new Date(now - (DEMO_LISTS.length - i) * 86_400_000 + minute++ * 60_000),
      }));
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
      // Seul l'identifiant du catalogue est enregistré (titre, affiche et genres sont relus dans le catalogue)
      await lists.insertMany(toCreate.map((l) => ({ ...l, movies: l.movies.map(({ movieId, addedAt }) => ({ movieId, addedAt })) })));
      console.log(`\nTerminé : ${deletedCount} liste(s) supprimée(s), ${toCreate.length} liste(s) créée(s).`);
    }
  }
} finally {
  await mongoose.disconnect();
}
