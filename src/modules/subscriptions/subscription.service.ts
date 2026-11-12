import { Types, type PipelineStage } from "mongoose";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { ApiError } from "@/modules/discovery/http";
import Subscription, { type SubscriptionDoc } from "./subscription.model";
import {
  LIVE_STATUSES,
  addPeriod,
  findPlan,
  planPrice,
  type BillingPeriod,
  type SubscriptionStatus,
} from "./subscription.constants";
import type {
  AdminCreateInput,
  AdminUpdateInput,
  ListSubscriptionsInput,
  OwnerUpdateInput,
  SubscribeInput,
  SubscriptionSort,
} from "./subscription.schema";

export interface Viewer {
  id: string;
  isAdmin: boolean;
}

// ---------- Format renvoyé au front ----------

export interface SubscriptionDto {
  id: string;
  planName: string;
  description: string;
  price: number;
  billingPeriod: BillingPeriod;
  startDate: string;
  endDate: string | null;
  status: SubscriptionStatus;
  isMine: boolean;
  user: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPage {
  subscriptions: SubscriptionDto[];
  page: number;
  totalPages: number;
  total: number;
}

type SubscriptionRow = SubscriptionDoc & {
  user?: { _id: Types.ObjectId; name: string; email: string } | null;
};

function toDto(row: SubscriptionRow, viewerId?: string): SubscriptionDto {
  const ownerId = row.userId.toString();
  return {
    id: row._id.toString(),
    planName: row.planName,
    description: row.description ?? "",
    price: row.price,
    billingPeriod: row.billingPeriod,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate ? row.endDate.toISOString() : null,
    status: row.status,
    isMine: ownerId === viewerId,
    user: { id: ownerId, name: row.user?.name ?? "Utilisateur supprimé", email: row.user?.email ?? "" },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const SORT_STAGE: Record<SubscriptionSort, Record<string, 1 | -1>> = {
  recent: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "price-desc": { price: -1, createdAt: -1 },
  "price-asc": { price: 1, createdAt: -1 },
  // Sans date de fin, l'abonnement est classé en dernier
  "end-soon": { sortEnd: 1, createdAt: -1 },
};

function userLookupStages(): PipelineStage.FacetPipelineStage[] {
  return [
    {
      $lookup: {
        from: User.collection.name,
        localField: "userId",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1, email: 1 } }],
        as: "user",
      },
    },
    { $addFields: { user: { $first: "$user" } } },
  ];
}

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- Statuts calculés à partir des dates ----------

// Pas de tâche planifiée : les statuts sont mis à jour à chaque lecture.
//  - un abonnement actif ou en attente dont la date de fin est passée devient « expiré » ;
//  - un abonnement en attente dont la date de début est arrivée devient « actif ».
export async function syncStatuses(userId?: string): Promise<void> {
  const now = new Date();
  const scope = userId ? { userId: new Types.ObjectId(userId) } : {};
  await Subscription.updateMany(
    { ...scope, status: { $in: LIVE_STATUSES }, endDate: { $ne: null, $lte: now } },
    { $set: { status: "expired" } }
  );
  await Subscription.updateMany({ ...scope, status: "pending", startDate: { $lte: now } }, { $set: { status: "active" } });
}

// Règle métier : un seul abonnement actif ou en attente par utilisateur
async function assertNoLiveSubscription(userId: string, exceptId?: string): Promise<void> {
  const filter: Record<string, unknown> = { userId, status: { $in: LIVE_STATUSES } };
  if (exceptId) filter._id = { $ne: exceptId };
  if (await Subscription.exists(filter)) {
    throw new ApiError(409, "Cet utilisateur a déjà un abonnement actif ou en attente : modifiez-le ou résiliez-le d'abord.");
  }
}

// Statut initial déduit des dates (utilisé quand l'administrateur choisit un statut « vivant »)
function statusFromDates(status: SubscriptionStatus, startDate: Date, endDate: Date | null): SubscriptionStatus {
  if (!LIVE_STATUSES.includes(status)) return status;
  const now = new Date();
  if (endDate && endDate <= now) return "expired";
  return startDate > now ? "pending" : "active";
}

async function getRow(id: string): Promise<SubscriptionRow | null> {
  const [row] = await Subscription.aggregate<SubscriptionRow>([
    { $match: { _id: new Types.ObjectId(id) } },
    ...userLookupStages(),
  ]);
  return row ?? null;
}

// ---------- Lecture (R) ----------

export async function listSubscriptions(input: ListSubscriptionsInput, viewer: Viewer): Promise<SubscriptionPage> {
  await dbConnect();
  if (input.scope === "all" && !viewer.isAdmin) throw new ApiError(403, "Accès réservé aux administrateurs.");
  const mine = input.scope === "mine";
  await syncStatuses(mine ? viewer.id : undefined);

  const match: Record<string, unknown> = {};
  if (mine) match.userId = new Types.ObjectId(viewer.id);
  if (input.status) match.status = input.status;
  if (input.billingPeriod) match.billingPeriod = input.billingPeriod;
  if (input.planName) match.planName = { $regex: `^${escapeRegex(input.planName)}$`, $options: "i" };

  const search: PipelineStage[] = [];
  if (input.q) {
    const rx = { $regex: escapeRegex(input.q), $options: "i" };
    search.push({ $match: { $or: [{ planName: rx }, { description: rx }, { "user.name": rx }, { "user.email": rx }] } });
  }

  const { sort, page, limit } = input;
  const [result] = await Subscription.aggregate<{ items: SubscriptionRow[]; total: { n: number }[] }>([
    { $match: match },
    ...userLookupStages(),
    ...search,
    { $addFields: { sortEnd: { $ifNull: ["$endDate", new Date("9999-12-31")] } } },
    {
      $facet: {
        items: [{ $sort: SORT_STAGE[sort] }, { $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: "n" }],
      },
    },
  ]);
  const total = result.total[0]?.n ?? 0;
  return {
    subscriptions: result.items.map((r) => toDto(r, viewer.id)),
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    total,
  };
}

// Détail : visible par son propriétaire ou un administrateur (404 sinon, pour ne rien divulguer)
export async function getSubscription(id: string, viewer: Viewer): Promise<SubscriptionDto> {
  await dbConnect();
  await syncStatuses();
  const row = await getRow(id);
  if (!row || (!viewer.isAdmin && row.userId.toString() !== viewer.id)) throw new ApiError(404, "Abonnement introuvable.");
  return toDto(row, viewer.id);
}

// L'abonnement en cours (actif ou en attente) de l'utilisateur, s'il en a un
export async function getCurrentSubscription(userId: string): Promise<SubscriptionDto | null> {
  await dbConnect();
  await syncStatuses(userId);
  const doc = await Subscription.findOne({ userId, status: { $in: LIVE_STATUSES } })
    .sort({ startDate: -1 })
    .lean<SubscriptionDoc>();
  if (!doc) return null;
  const row = await getRow(doc._id.toString());
  return row ? toDto(row, userId) : null;
}

// ---------- Création (C) ----------

// Utilisateur : souscription à une offre du catalogue, active immédiatement pour une période
export async function subscribe(userId: string, input: SubscribeInput): Promise<SubscriptionDto> {
  await dbConnect();
  await syncStatuses(userId);
  if (await Subscription.exists({ userId, status: { $in: LIVE_STATUSES } })) {
    throw new ApiError(409, "Vous avez déjà un abonnement en cours : changez d'offre plutôt que d'en créer un second.");
  }
  const plan = findPlan(input.planName)!;
  const startDate = new Date();
  const doc = await Subscription.create({
    userId,
    planName: plan.name,
    description: plan.description,
    price: planPrice(plan, input.billingPeriod),
    billingPeriod: input.billingPeriod,
    startDate,
    endDate: addPeriod(startDate, input.billingPeriod),
    status: "active",
  });
  return toDto((await getRow(doc._id.toString()))!, userId);
}

// Administrateur : création libre pour l'utilisateur désigné par son e-mail
export async function adminCreate(input: AdminCreateInput, viewer: Viewer): Promise<SubscriptionDto> {
  await dbConnect();
  const user = await User.findOne({ email: input.userEmail }).select("_id").lean<{ _id: Types.ObjectId }>();
  if (!user) throw new ApiError(404, "Aucun utilisateur avec cette adresse e-mail.");
  const userId = user._id.toString();
  const endDate = input.endDate ?? null;
  const status = statusFromDates(input.status, input.startDate, endDate);
  await syncStatuses(userId);
  if (LIVE_STATUSES.includes(status)) await assertNoLiveSubscription(userId);
  const { userEmail: _ignored, ...fields } = input;
  void _ignored;
  const doc = await Subscription.create({ ...fields, userId, endDate, status });
  return toDto((await getRow(doc._id.toString()))!, viewer.id);
}

// ---------- Modification (U) ----------

// Utilisateur : upgrade / downgrade (la nouvelle période démarre aujourd'hui) ou résiliation
export async function ownerUpdate(id: string, userId: string, input: OwnerUpdateInput): Promise<SubscriptionDto> {
  await dbConnect();
  await syncStatuses(userId);
  const doc = await Subscription.findOne({ _id: id, userId });
  if (!doc) throw new ApiError(404, "Abonnement introuvable.");
  if (!LIVE_STATUSES.includes(doc.status)) {
    throw new ApiError(400, "Cet abonnement n'est plus en cours : souscrivez à une nouvelle offre.");
  }

  if (input.action === "cancel") {
    doc.status = "cancelled";
    // Fin immédiate ; un abonnement en attente (pas encore commencé) garde sa date de fin prévue
    const now = new Date();
    if (doc.startDate < now) doc.endDate = now;
  } else {
    const plan = findPlan(input.planName)!;
    if (plan.name === doc.planName && input.billingPeriod === doc.billingPeriod) {
      throw new ApiError(400, "Vous êtes déjà abonné à cette offre.");
    }
    const startDate = new Date();
    doc.set({
      planName: plan.name,
      description: plan.description,
      price: planPrice(plan, input.billingPeriod),
      billingPeriod: input.billingPeriod,
      startDate,
      endDate: addPeriod(startDate, input.billingPeriod),
      status: "active",
    });
  }
  await doc.save();
  return toDto((await getRow(id))!, userId);
}

// Administrateur : modification libre, en conservant la cohérence des dates et la règle d'un seul abonnement en cours
export async function adminUpdate(id: string, input: AdminUpdateInput, viewer: Viewer): Promise<SubscriptionDto> {
  await dbConnect();
  const doc = await Subscription.findById(id);
  if (!doc) throw new ApiError(404, "Abonnement introuvable.");

  const startDate = input.startDate ?? doc.startDate;
  const endDate = input.endDate === undefined ? doc.endDate : input.endDate;
  if (endDate && endDate <= startDate) throw new ApiError(400, "La date de fin doit être postérieure à la date de début.");

  const status = statusFromDates(input.status ?? doc.status, startDate, endDate);
  if (LIVE_STATUSES.includes(status)) await assertNoLiveSubscription(doc.userId.toString(), id);

  doc.set({ ...input, startDate, endDate, status });
  await doc.save();
  return toDto((await getRow(id))!, viewer.id);
}

// ---------- Suppression (D) ----------

// Le propriétaire supprime un abonnement terminé de son historique ; l'administrateur supprime n'importe lequel
export async function deleteSubscription(id: string, viewer: Viewer): Promise<void> {
  await dbConnect();
  const doc = await Subscription.findById(id).lean<SubscriptionDoc>();
  if (!doc || (!viewer.isAdmin && doc.userId.toString() !== viewer.id)) throw new ApiError(404, "Abonnement introuvable.");
  if (!viewer.isAdmin && LIVE_STATUSES.includes(doc.status)) {
    throw new ApiError(400, "Résiliez cet abonnement avant de le supprimer de votre historique.");
  }
  await Subscription.deleteOne({ _id: id });
}

// ---------- Tableau de bord administrateur ----------

export interface SubscriptionStats {
  total: number;
  byStatus: Record<SubscriptionStatus, number>;
  activeByPlan: { planName: string; count: number }[];
  monthlyRevenue: number; // revenu mensuel estimé des abonnements actifs (annuel ramené au mois)
}

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  await dbConnect();
  await syncStatuses();
  const [statusRows, planRows] = await Promise.all([
    Subscription.aggregate<{ _id: SubscriptionStatus; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Subscription.aggregate<{ _id: string; count: number; monthly: number }>([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$planName",
          count: { $sum: 1 },
          monthly: { $sum: { $cond: [{ $eq: ["$billingPeriod", "yearly"] }, { $divide: ["$price", 12] }, "$price"] } },
        },
      },
      { $sort: { count: -1 } },
    ]),
  ]);
  const byStatus: SubscriptionStats["byStatus"] = { active: 0, pending: 0, expired: 0, cancelled: 0 };
  for (const r of statusRows) byStatus[r._id] = r.n;
  return {
    total: statusRows.reduce((s, r) => s + r.n, 0),
    byStatus,
    activeByPlan: planRows.map((r) => ({ planName: r._id, count: r.count })),
    monthlyRevenue: Math.round(planRows.reduce((s, r) => s + r.monthly, 0) * 100) / 100,
  };
}
