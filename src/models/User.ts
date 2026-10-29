import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom est obligatoire."],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "L'adresse e-mail est obligatoire."],
      match: [/^\S+@\S+\.\S+$/, "Veuillez fournir une adresse e-mail valide."],
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est obligatoire."],
    },
    role: {
      type: String,
      default: "user",
      enum: {
        values: ["user", "admin"],
        message: "Le rôle doit être soit 'user' soit 'admin'.",
      },
    },
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);
export default User;
