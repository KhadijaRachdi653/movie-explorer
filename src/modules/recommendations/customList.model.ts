import { Schema, model, models, type Model, type Types } from "mongoose";
import { VISIBILITIES, type Visibility } from "./types";

export const MAX_LISTS_PER_USER = 20;
export const MAX_MOVIES_PER_LIST = 100;

export interface ListMovieDoc {
  movieId: number;
  title: string;
  posterPath: string | null;
  genreIds: number[];
  addedAt: Date;
}

export interface CustomListDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description: string;
  visibility: Visibility;
  movies: ListMovieDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const ListMovieSchema = new Schema<ListMovieDoc>(
  {
    movieId: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    posterPath: { type: String, default: null },
    genreIds: { type: [Number], default: [] },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CustomListSchema = new Schema<CustomListDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    description: { type: String, default: "", trim: true, maxlength: 300 },
    visibility: { type: String, enum: VISIBILITIES, default: "private" },
    movies: {
      type: [ListMovieSchema],
      default: [],
      validate: {
        validator: (v: ListMovieDoc[]) => v.length <= MAX_MOVIES_PER_LIST,
        message: `Une liste ne peut pas contenir plus de ${MAX_MOVIES_PER_LIST} films.`,
      },
    },
  },
  { timestamps: true, collection: "customLists" }
);

// Règle métier : pas deux listes du même nom pour un utilisateur (insensible à la casse)
CustomListSchema.index({ userId: 1, name: 1 }, { unique: true, collation: { locale: "fr", strength: 2 } });

const CustomList: Model<CustomListDoc> =
  (models.CustomList as Model<CustomListDoc>) || model<CustomListDoc>("CustomList", CustomListSchema);

export default CustomList;
