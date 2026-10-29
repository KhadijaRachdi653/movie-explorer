import { Schema, model, models } from "mongoose";

const ReviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    movieId: { type: Number, required: true },
    content: {
      type: String,
      required: [true, "Le commentaire est obligatoire."],
      trim: true,
      minlength: [3, "Le commentaire est trop court."],
      maxlength: [1000, "Le commentaire ne peut pas dépasser 1000 caractères."],
    },
  },
  { timestamps: true }
);

// One review per user per movie (simplest rule; can be relaxed later)
ReviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });
ReviewSchema.index({ movieId: 1, createdAt: -1 });

const Review = models.Review || model("Review", ReviewSchema);
export default Review;