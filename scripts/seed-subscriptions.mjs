// Données de démonstration du Module 2 (abonnements) pour les comptes de démo @demo.cinea.
//   node --env-file=.env.local scripts/seed-reviews.mjs                → crée d'abord les comptes de démo (Module 3)
//   node --env-file=.env.local scripts/seed-subscriptions.mjs          → (re)crée les abonnements de démo
//   node --env-file=.env.local scripts/seed-subscriptions.mjs --remove → supprime les abonnements de démo
// Ne touche jamais aux abonnements des vrais comptes.
import mongoose from "mongoose";

const DEMO_DOMAIN = "@demo.cinea";
const DAY = 86_400_000;

const PLANS = [
  { name: "Basique", description: "L'essentiel pour explorer le catalogue CINEA.", monthly: 0, yearly: 0 },
  { name: "Premium", description: "Pour les cinéphiles qui regardent chaque semaine.", monthly: 14.9, yearly: 149 },
  { name: "Ultime", description: "Le meilleur de CINEA, en famille.", monthly: 24.9, yearly: 249 },
];

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
const rand = prng(20261112);
const pickOne = (arr) => arr[Math.floor(rand() * arr.length)];

function addPeriod(start, period) {
  const end = new Date(start);
  if (period === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

function makeSub(userId, { plan, period, start, status, endDate }) {
  const createdAt = new Date(Math.min(start.getTime(), Date.now()));
  return {
    _id: new mongoose.Types.ObjectId(),
    userId,
    planName: plan.name,
    description: plan.description,
    price: period === "yearly" ? plan.yearly : plan.monthly,
    billingPeriod: period,
    startDate: start,
    endDate: endDate === undefined ? addPeriod(start, period) : endDate,
    status,
    createdAt,
    updatedAt: createdAt,
    __v: 0,
  };
}

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const demoUsers = await db
  .collection("users")
  .find({ email: { $regex: `${DEMO_DOMAIN.replace(".", "\\.")}$` } }, { projection: { _id: 1, name: 1 } })
  .toArray();
const demoIds = demoUsers.map((u) => u._id);

// Abonnements des comptes de démo + abonnements orphelins (compte supprimé, par ex. après un nouveau seed-reviews)
const allUserIds = (await db.collection("users").find({}, { projection: { _id: 1 } }).toArray()).map((u) => u._id);
const { deletedCount } = await db.collection("subscriptions").deleteMany({
  $or: [{ userId: { $in: demoIds } }, { userId: { $nin: allUserIds } }],
});
console.log(`Abonnements de démo supprimés : ${deletedCount}.`);

if (!process.argv.includes("--remove")) {
  if (!demoUsers.length) {
    console.log("Aucun compte @demo.cinea : lancez d'abord scripts/seed-reviews.mjs.");
  } else {
    const now = Date.now();
    const docs = [];
    for (const user of demoUsers) {
      const period = rand() < 0.3 ? "yearly" : "monthly";
      const roll = rand();
      // Un abonnement passé (expiré ou résilié) pour une partie des comptes
      if (rand() < 0.6) {
        const plan = pickOne(PLANS);
        const start = new Date(now - (400 + Math.floor(rand() * 200)) * DAY);
        const cancelled = rand() < 0.4;
        docs.push(
          makeSub(user._id, {
            plan,
            period: "monthly",
            start,
            status: cancelled ? "cancelled" : "expired",
            endDate: cancelled ? new Date(start.getTime() + 12 * DAY) : addPeriod(start, "monthly"),
          })
        );
      }
      // Abonnement en cours : la plupart actifs, quelques-uns en attente ou sans abonnement
      if (roll < 0.75) {
        const plan = rand() < 0.2 ? PLANS[0] : rand() < 0.65 ? PLANS[1] : PLANS[2];
        const span = period === "yearly" ? 300 : 25;
        docs.push(makeSub(user._id, { plan, period, start: new Date(now - Math.floor(rand() * span) * DAY), status: "active" }));
      } else if (roll < 0.85) {
        docs.push(makeSub(user._id, { plan: PLANS[1], period, start: new Date(now + (3 + Math.floor(rand() * 10)) * DAY), status: "pending" }));
      }
    }
    if (docs.length) await db.collection("subscriptions").insertMany(docs);
    const count = (s) => docs.filter((d) => d.status === s).length;
    console.log(
      `Créé : ${docs.length} abonnements pour ${demoUsers.length} comptes de démo ` +
        `(${count("active")} actifs, ${count("pending")} en attente, ${count("expired")} expirés, ${count("cancelled")} résiliés).`
    );
  }
}
await mongoose.disconnect();
