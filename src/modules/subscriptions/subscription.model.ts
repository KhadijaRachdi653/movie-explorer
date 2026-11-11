import { Schema, model, models, type Model, type Types } from "mongoose";
import { BILLING_PERIODS, SUBSCRIPTION_STATUSES, type BillingPeriod, type SubscriptionStatus } from "./subscription.constants";

export interface SubscriptionDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  planName: string;
  description: string;
  price: number;
  billingPeriod: BillingPeriod;
  startDate: Date;
  endDate: Date | null;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<SubscriptionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: [true, "L'utilisateur est obligatoire."] },
    planName: {
      type: String,
      required: [true, "Le nom de l'offre est obligatoire."],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    price: { type: Number, required: [true, "Le prix est obligatoire."], min: [0, "Le prix ne peut pas être négatif."] },
    billingPeriod: { type: String, enum: BILLING_PERIODS, required: true, default: "monthly" },
    startDate: { type: Date, required: true, default: () => new Date() },
    endDate: { type: Date, default: null },
    status: { type: String, enum: SUBSCRIPTION_STATUSES, required: true, default: "active" },
  },
  { timestamps: true, collection: "subscriptions" }
);

// Cohérence des dates, vérifiée à chaque create() / save()
SubscriptionSchema.pre("validate", function () {
  if (this.endDate && this.startDate && this.endDate <= this.startDate) {
    this.invalidate("endDate", "La date de fin doit être postérieure à la date de début.");
  }
});

// Abonnements d'un utilisateur, filtrés par statut (page « Mon abonnement », règle d'un seul abonnement actif)
SubscriptionSchema.index({ userId: 1, status: 1 });
// Passage automatique en « expiré » / « actif » et filtres administrateur
SubscriptionSchema.index({ status: 1, endDate: 1 });
SubscriptionSchema.index({ createdAt: -1 });

// models.Subscription évite l'erreur « OverwriteModelError » lors du rechargement à chaud de Next.js
export const Subscription: Model<SubscriptionDoc> =
  (models.Subscription as Model<SubscriptionDoc>) || model<SubscriptionDoc>("Subscription", SubscriptionSchema);

export default Subscription;
