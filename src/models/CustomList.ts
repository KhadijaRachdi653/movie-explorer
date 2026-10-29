import { Schema, model, models } from "mongoose";

// Film stocké dans une liste (on garde le minimum pour l'affichage hors ligne)
const ListMovieSchema = new Schema(
  {
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    posterPath: { type: String, default: null },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CustomListSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Le propriétaire est obligatoire."],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Le nom de la liste est obligatoire."],
      trim: true,
      minlength: [2, "Le nom doit contenir au moins 2 caractères."],
      maxlength: [50, "Le nom ne doit pas dépasser 50 caractères."],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "La description ne doit pas dépasser 300 caractères."],
    },
    isPublic: { type: Boolean, default: false },
    movies: { type: [ListMovieSchema], default: [] },
  },
  { timestamps: true }
);

// Règle métier : un utilisateur ne peut pas avoir deux listes du même nom
CustomListSchema.index({ user: 1, name: 1 }, { unique: true, collation: { locale: "fr", strength: 2 } });

const CustomList = models.CustomList || model("CustomList", CustomListSchema);
export default CustomList;
