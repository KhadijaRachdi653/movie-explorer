// Import ponctuel de ~100 films populaires de TMDB dans le catalogue (collection `movies`, Module 2).
//   node --env-file=.env.local scripts/import-tmdb-movies.mjs           → importe (les films déjà présents sont ignorés)
//   node --env-file=.env.local scripts/import-tmdb-movies.mjs --remove  → supprime les films importés (+ leurs notes,
//                                                                         avis et présence dans les listes)
// TMDB_API_KEY n'est nécessaire que pendant l'import : l'application lit ensuite uniquement MongoDB.
import mongoose from "mongoose";

const TARGET = 100;
const SOURCE = "tmdb-import"; // marque les films importés pour pouvoir les retirer
const API = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";

async function tmdb(path, params = {}) {
  const url = new URL(API + path);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY);
  url.searchParams.set("language", "fr-FR");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status} sur ${path}`);
  return res.json();
}

async function removeImported(db) {
  const ids = (await db.collection("movies").find({ source: SOURCE }, { projection: { _id: 1 } }).toArray()).map((m) => m._id.toString());
  if (!ids.length) return 0;
  const reviewIds = (await db.collection("reviews").find({ movieId: { $in: ids } }, { projection: { _id: 1 } }).toArray()).map((r) => r._id);
  await db.collection("reviewreports").deleteMany({ reviewId: { $in: reviewIds } });
  await db.collection("reviews").deleteMany({ movieId: { $in: ids } });
  await db.collection("ratings").deleteMany({ movieId: { $in: ids } });
  await db.collection("customLists").updateMany({}, { $pull: { movies: { movieId: { $in: ids } } } });
  await db.collection("movies").deleteMany({ source: SOURCE });
  return ids.length;
}

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

if (process.argv.includes("--remove")) {
  console.log(`Films importés supprimés : ${await removeImported(db)}.`);
} else {
  if (!process.env.TMDB_API_KEY) {
    console.error("TMDB_API_KEY manquante dans .env.local (nécessaire seulement pour l'import).");
    process.exit(1);
  }
  const { genres } = await tmdb("/genre/movie/list");
  const genreName = new Map(genres.map((g) => [g.id, g.name]));
  const existing = new Set(
    (await db.collection("movies").find({}, { projection: { title: 1 } }).toArray()).map((m) => m.title.trim().toLowerCase())
  );

  // Films les mieux notés puis populaires, sans doublon ni film déjà au catalogue
  const picked = new Map();
  for (const path of ["/movie/top_rated", "/movie/popular"]) {
    for (let page = 1; page <= 5 && picked.size < TARGET; page++) {
      for (const m of (await tmdb(path, { page })).results) {
        if (picked.size >= TARGET) break;
        if (!m.poster_path || !m.overview || existing.has(m.title.trim().toLowerCase()) || picked.has(m.id)) continue;
        picked.set(m.id, m);
      }
    }
  }

  const now = Date.now();
  const docs = [];
  for (const [i, m] of [...picked.values()].entries()) {
    const credits = await tmdb(`/movie/${m.id}/credits`);
    const createdAt = new Date(now - i * 60_000); // ordre d'ajout stable dans le catalogue
    docs.push({
      title: m.title.replace(/[‎‏‪-‮]/g, "").trim().slice(0, 200), // sans marques de direction invisibles
      overview: m.overview,
      posterUrl: `${IMG}/w500${m.poster_path}`,
      year: Number(m.release_date?.slice(0, 4)) || 0,
      genres: (m.genre_ids ?? []).map((id) => genreName.get(id)).filter(Boolean),
      director: credits.crew?.find((c) => c.job === "Director")?.name ?? "",
      rating: Math.round((m.vote_average ?? 0) * 10) / 10,
      // Champs en plus, ignorés par le Module 2 : grande image (bannières du Module 6) et origine de la fiche
      backdropUrl: m.backdrop_path ? `${IMG}/w1280${m.backdrop_path}` : null,
      tmdbId: m.id,
      source: SOURCE,
      createdAt,
      updatedAt: createdAt,
      __v: 0,
    });
  }
  if (docs.length) await db.collection("movies").insertMany(docs);
  console.log(`Films importés : ${docs.length} (catalogue : ${await db.collection("movies").countDocuments()} films).`);
}
await mongoose.disconnect();
