import { Schema, model, models, type Model, type Types } from "mongoose";
import { COLLECTION_STATUSES, type CollectionStatus } from "./collection.types";

export interface CollectionMovieDoc {
  movieId: string; // identifiant du catalogue (ObjectId en texte)
  title: string;
  overview?: string;
  posterUrl?: string | null;
  releaseDate?: string | null;
  year?: number | null;
  rating?: number;
  genres: string[];
}

export interface CollectionItemDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  movie: CollectionMovieDoc;
  status: CollectionStatus;
  favorite: boolean;
  watchHistory: { watchedAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

const CollectionMovieSchema = new Schema<CollectionMovieDoc>(
  {
    movieId: { type: String, required: true, trim: true, maxlength: 24 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    overview: { type: String, maxlength: 5000 },
    posterUrl: { type: String, default: null, maxlength: 500 },
    releaseDate: { type: String, default: null, maxlength: 20 },
    year: { type: Number, default: null, min: 1870, max: 2200 },
    rating: { type: Number, min: 0, max: 10 },
    genres: { type: [String], default: [] },
  },
  { _id: false }
);

const CollectionItemSchema = new Schema<CollectionItemDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    movie: { type: CollectionMovieSchema, required: true },
    status: { type: String, enum: COLLECTION_STATUSES, default: "planned", required: true },
    favorite: { type: Boolean, default: false, required: true },
    watchHistory: {
      type: [{ watchedAt: { type: Date, required: true } }],
      default: [],
    },
  },
  { timestamps: true, collection: "collectionItems" }
);

CollectionItemSchema.index({ userId: 1, "movie.movieId": 1 }, { unique: true });
CollectionItemSchema.index({ userId: 1, favorite: 1, updatedAt: -1 });
CollectionItemSchema.index({ userId: 1, status: 1, updatedAt: -1 });

const CollectionItem: Model<CollectionItemDoc> =
  (models.CollectionItem as Model<CollectionItemDoc>) ||
  model<CollectionItemDoc>("CollectionItem", CollectionItemSchema);

export default CollectionItem;
