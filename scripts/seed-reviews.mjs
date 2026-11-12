// Données de démonstration du Module 3 (notes, avis, likes) pour les films du catalogue.
//   node --env-file=.env.local scripts/seed-reviews.mjs           → (re)crée les données de démo
//   node --env-file=.env.local scripts/seed-reviews.mjs --remove  → supprime tout ce qui a été créé
// Les comptes de démo (@demo.cinea) ont un mot de passe aléatoire : personne ne peut s'y connecter.
import crypto from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const DEMO_DOMAIN = "@demo.cinea";
const NAMES = [
  "Sarra Ben Ali", "Youssef Trabelsi", "Ines Mansouri", "Mehdi Gharbi", "Amira Jaziri",
  "Karim Bouazizi", "Lina Haddad", "Omar Chaabane", "Nour Kefi", "Rami Saidi",
  "Yasmine Belhadj", "Aziz Hammami", "Mariem Ayari", "Hamza Riahi", "Emna Ferchichi",
  "Bilel Masmoudi", "Salma Khelifi", "Anis Dridi", "Chaima Zouari", "Walid Ghanmi",
  "Rania Sassi", "Firas Jebali", "Molka Toumi", "Seif Baccouche", "Hiba Mejri",
];

// Avis rédigés par film (titre du catalogue) : [note, texte, spoiler?]
const REVIEWS = {
  "Le Parrain": [
    [5, "Un monument. Chaque plan est composé comme un tableau, et Marlon Brando est hypnotique. Trois heures qui passent sans qu'on regarde l'heure une seule fois.", false],
    [5, "La scène du baptême montée en parallèle avec les règlements de comptes m'a laissé sans voix. Michael finit par devenir exactement ce qu'il refusait d'être.", true],
    [4, "Magnifique mais exigeant : le premier tiers est lent et il faut s'accrocher aux noms de famille. Une fois lancé, impossible de décrocher.", false],
    [5, "Revu au cinéma pour ses 50 ans, ça n'a pas pris une ride. La musique de Nino Rota reste en tête pendant des jours.", false],
  ],
  Inception: [
    [5, "Le genre de film qui te suit après la séance. Les rêves imbriqués sont clairs alors que l'idée est complexe, chapeau à Nolan.", false],
    [4, "Visuellement incroyable (le couloir qui tourne !), un peu trop d'explications dans les dialogues par moments, mais quelle ambition.", false],
    [5, "Cette toupie à la fin… j'en débats encore avec mes amis. Et la BO de Hans Zimmer est une claque.", true],
    [3, "Bonne idée de départ mais je l'ai trouvé froid : beaucoup de mécanique, peu d'émotion à part l'histoire de Cobb et Mal.", false],
  ],
  Interstellar: [
    [5, "J'ai pleuré devant les messages vidéo sur la planète de Miller. Un film de science-fiction qui parle avant tout d'un père et de sa fille.", false],
    [5, "Le trou noir Gargantua est sublime, et le fait que des physiciens aient travaillé dessus rend tout ça encore plus fascinant.", false],
    [4, "Grandiose, même si la dernière demi-heure demande d'accepter beaucoup de choses. L'orgue de Zimmer donne des frissons.", false],
    [4, "Long mais jamais ennuyeux. Matthew McConaughey porte le film, Anne Hathaway est très juste aussi.", false],
  ],
  "Pulp Fiction": [
    [5, "Des dialogues cultes à chaque scène, une construction qui casse la chronologie sans jamais perdre le spectateur. Du Tarantino au sommet.", false],
    [4, "La danse de Travolta et Uma Thurman vaut le film à elle seule. Quelques passages trop violents à mon goût.", false],
    [5, "On croit regarder des histoires séparées et tout se recoupe dans le diner à la fin. Génial à revoir une deuxième fois.", true],
    [3, "Culte, je comprends pourquoi, mais j'ai eu du mal avec certains personnages. À voir au moins une fois pour la culture.", false],
  ],
  "Le Voyage de Chihiro": [
    [5, "Un conte d'une richesse folle : chaque esprit des bains a sa personnalité. Je le regarde avec mes petites sœurs et on l'adore toutes.", false],
    [5, "Le Sans-Visage m'a fait peur enfant, aujourd'hui je le trouve touchant. Miyazaki parle de grandir mieux que personne.", false],
    [4, "Magnifique et poétique, la scène du train sur l'eau est d'une douceur incroyable. Un peu déroutant au début.", false],
    [5, "Le dessin à la main, la musique de Joe Hisaishi… un chef-d'œuvre absolu de l'animation.", false],
  ],
};

// Générateur pseudo-aléatoire reproductible
function prng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = prng(20261111);
const pick = (n, from) => [...from].sort(() => rand() - 0.5).slice(0, n);
const daysAgo = (max) => new Date(Date.now() - Math.floor(rand() * max * 86_400_000));

// Notes aléatoires dont la somme vaut exactement `total`
function scoresWithSum(count, total) {
  const scores = Array.from({ length: count }, () => Math.min(5, Math.max(1, Math.round(total / count + (rand() - 0.5) * 2))));
  let diff = total - scores.reduce((a, b) => a + b, 0);
  for (let guard = 0; diff !== 0 && guard < 10_000; guard++) {
    const i = Math.floor(rand() * count);
    const step = diff > 0 ? 1 : -1;
    if (scores[i] + step >= 1 && scores[i] + step <= 5) {
      scores[i] += step;
      diff -= step;
    }
  }
  return scores;
}

async function removeDemo(db) {
  const ids = (await db.collection("users").find({ email: { $regex: `${DEMO_DOMAIN.replace(".", "\\.")}$` } }, { projection: { _id: 1 } }).toArray()).map((u) => u._id);
  if (!ids.length) return 0;
  const reviewIds = (await db.collection("reviews").find({ userId: { $in: ids } }, { projection: { _id: 1 } }).toArray()).map((r) => r._id);
  await db.collection("reviewreports").deleteMany({ $or: [{ reviewId: { $in: reviewIds } }, { reporterUserId: { $in: ids } }] });
  await db.collection("reviews").deleteMany({ userId: { $in: ids } });
  await db.collection("reviews").updateMany({}, { $pull: { likes: { $in: ids } } });
  await db.collection("ratings").deleteMany({ userId: { $in: ids } });
  await db.collection("users").deleteMany({ _id: { $in: ids } });
  return ids.length;
}

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const removed = await removeDemo(db);
console.log(`Données de démo supprimées : ${removed} compte(s).`);

if (!process.argv.includes("--remove")) {
  const password = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
  const users = NAMES.map((name, i) => {
    const createdAt = daysAgo(400);
    return {
      _id: new mongoose.Types.ObjectId(),
      name,
      email: `demo${String(i + 1).padStart(2, "0")}${DEMO_DOMAIN}`,
      password,
      avatar: "",
      role: "user",
      valide: false,
      createdAt,
      updatedAt: createdAt,
    };
  });
  await db.collection("users").insertMany(users);

  const movies = await db.collection("movies").find().toArray();
  let ratingCount = 0;
  let reviewCount = 0;
  for (const movie of movies) {
    const movieId = movie._id.toString();
    const target = Math.min(4.8, Math.max(1.5, (movie.rating || 7) / 2)); // note catalogue /10 → /5
    const voters = pick(15 + Math.floor(rand() * 11), users);
    const written = REVIEWS[movie.title] ?? [];
    const reviewers = voters.slice(0, written.length);

    // Les auteurs d'avis gardent la note de leur avis ; les autres complètent pour atteindre la moyenne cible
    const fixed = written.map(([score]) => score);
    const others = scoresWithSum(voters.length - fixed.length, Math.round(target * voters.length) - fixed.reduce((a, b) => a + b, 0));
    const scores = [...fixed, ...others];
    const ratings = voters.map((u, i) => {
      const at = daysAgo(180);
      return { _id: new mongoose.Types.ObjectId(), userId: u._id, movieId, score: scores[i], createdAt: at, updatedAt: at, __v: 0 };
    });
    await db.collection("ratings").insertMany(ratings);
    ratingCount += ratings.length;

    const reviews = written.map(([, content, spoiler], i) => {
      const author = reviewers[i];
      const fans = users.filter((u) => u._id !== author._id);
      const likeCount = i === 0 ? 9 + Math.floor(rand() * 6) : Math.floor(rand() * 7); // le premier avis est le plus aimé
      const at = daysAgo(150);
      return {
        _id: new mongoose.Types.ObjectId(),
        userId: author._id,
        movieId,
        content,
        spoiler,
        likes: pick(likeCount, fans).map((u) => u._id),
        createdAt: at,
        updatedAt: at,
        __v: 0,
      };
    });
    if (reviews.length) await db.collection("reviews").insertMany(reviews);
    reviewCount += reviews.length;

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    console.log(`  ${movie.title} : ${voters.length} notes, moyenne ${avg.toFixed(2)}/5 (catalogue ${movie.rating}/10), ${reviews.length} avis`);
  }
  console.log(`Créé : ${users.length} comptes de démo, ${ratingCount} notes, ${reviewCount} avis.`);
}
await mongoose.disconnect();
