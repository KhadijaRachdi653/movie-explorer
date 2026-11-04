import mongoose, { Schema, Document, Model, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true }, // 💡 Alignement ici
    password: { type: String, required: true },         // 💡 Alignement ici
    avatar: { type: String, default: "" },
    role: { type: String, default: "user" },
    valide: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

export type IUser = InferSchemaType<typeof UserSchema> & Document;
const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
export default User;
