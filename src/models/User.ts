import mongoose, {
  Schema,
  Document,
  Model,
  type InferSchemaType,
} from "mongoose";

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "user",
    },
    valide: {
      type: Boolean,
      default: false,
    },
    // 💡 STATUT ABONNEMENT SÉMANTIQUE : Vrai par défaut à la création pour faciliter vos tests
    isSubscribed: {
      type: Boolean,
      default: true,
    },
    verificationToken: { type: String, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true },
);

export type IUser = InferSchemaType<typeof UserSchema> & Document;

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
