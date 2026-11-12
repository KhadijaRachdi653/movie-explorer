import { Schema, model, models, type Model, type Types } from "mongoose";

// movieId : identifiant du film dans le catalogue (Module 2), stocké en texte

export interface RatingDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  movieId: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  movieId: string;
  content: string;
  spoiler: boolean;
  likes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewReportDoc {
  _id: Types.ObjectId;
  reviewId: Types.ObjectId;
  reporterUserId: Types.ObjectId;
  reason: string;
  createdAt: Date;
}

const RatingSchema = new Schema<RatingDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    movieId: { type: String, required: true, trim: true },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: Number.isInteger,
    },
  },
  { timestamps: true, collection: "ratings" },
);
// Règle métier : une seule note par utilisateur et par film
RatingSchema.index({ userId: 1, movieId: 1 }, { unique: true });
RatingSchema.index({ movieId: 1 });

const ReviewSchema = new Schema<ReviewDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    movieId: { type: String, required: true, trim: true },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 1000,
    },
    spoiler: { type: Boolean, default: false },
    likes: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
  },
  { timestamps: true, collection: "reviews" },
);
// Règle métier : un seul commentaire par utilisateur et par film
ReviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });
ReviewSchema.index({ movieId: 1, createdAt: -1 });

const ReviewReportSchema = new Schema<ReviewReportDoc>(
  {
    reviewId: { type: Schema.Types.ObjectId, ref: "Review", required: true },
    reporterUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "reviewreports",
  },
);
// Un utilisateur ne signale qu'une fois le même commentaire
ReviewReportSchema.index({ reviewId: 1, reporterUserId: 1 }, { unique: true });

export const Rating: Model<RatingDoc> =
  (models.Rating as Model<RatingDoc>) ||
  model<RatingDoc>("Rating", RatingSchema);
export const Review: Model<ReviewDoc> =
  (models.Review as Model<ReviewDoc>) ||
  model<ReviewDoc>("Review", ReviewSchema);
export const ReviewReport: Model<ReviewReportDoc> =
  (models.ReviewReport as Model<ReviewReportDoc>) ||
  model<ReviewReportDoc>("ReviewReport", ReviewReportSchema);
