import { Schema, model, models } from "mongoose";

const RatingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    movieId: { type: Number, required: [true, "L'identifiant du film est obligatoire."] },
    score: {
      type: Number,
      required: [true, "La note est obligatoire."],
      min: [1, "La note minimale est 1."],
      max: [5, "La note maximale est 5."],
      validate: { validator: Number.isInteger, message: "La note doit être un entier." },
    },
  },
  { timestamps: true }
);

// One rating per user per movie
RatingSchema.index({ userId: 1, movieId: 1 }, { unique: true });
RatingSchema.index({ movieId: 1 });

const Rating = models.Rating || model("Rating", RatingSchema);
export default Rating;