import mongoose, { Schema, Document, Model, type InferSchemaType } from "mongoose";

const PushSubscriptionSchema = new Schema(
  {
    // ID de l'administrateur propriétaire du navigateur récepteur
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true // Évite d'enregistrer des doublons pour la même session admin
    },
    // URL unique fournie par le constructeur du navigateur (Google, Apple, Microsoft) pour envoyer le push
    endpoint: {
      type: String,
      required: true
    },
    // Clés de chiffrement cryptographiques asymétriques requises par le protocole Web-Push
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    }
  },
  { timestamps: true }
);

export type IPushSubscription = InferSchemaType<typeof PushSubscriptionSchema> & Document;

export const PushSubscription: Model<IPushSubscription> =
  (mongoose.models.PushSubscription as Model<IPushSubscription>) ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;
