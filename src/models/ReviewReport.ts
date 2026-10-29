import { Schema, model, models } from "mongoose";

const ReviewReportSchema = new Schema(
  {
    reviewId: { type: Schema.Types.ObjectId, ref: "Review", required: true },
    reporterUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ReviewReportSchema.index({ reviewId: 1, reporterUserId: 1 }, { unique: true });

const ReviewReport = models.ReviewReport || model("ReviewReport", ReviewReportSchema);
export default ReviewReport;