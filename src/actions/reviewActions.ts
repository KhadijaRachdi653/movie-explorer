"use server";

import dbConnect from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import Rating from "@/models/Rating";
import Review from "@/models/Review";
import ReviewReport from "@/models/ReviewReport";
import { revalidatePath } from "next/cache";

export type ReviewActionState = { error?: string | null; success?: string | null };

const isValidMovieId = (id: unknown): id is number =>
  typeof id === "number" && Number.isInteger(id) && id > 0;

// CREATE or UPDATE a rating
export async function setRating(movieId: number, score: number): Promise<ReviewActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Vous devez être connecté pour noter un film." };
    if (!isValidMovieId(movieId)) return { error: "Film invalide." };
    if (!Number.isInteger(score) || score < 1 || score > 5)
      return { error: "La note doit être comprise entre 1 et 5." };

    await dbConnect();
    await Rating.findOneAndUpdate(
      { userId: session.user.id, movieId },
      { score },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    revalidatePath(`/movies/${movieId}/reviews`);
    revalidatePath("/profile/ratings");
    return { success: "Note enregistrée !" };
  } catch (err) {
    console.error("Erreur setRating :", err);
    return { error: "Erreur lors de l'enregistrement de la note." };
  }
}

// DELETE own rating
export async function deleteRating(movieId: number): Promise<ReviewActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Non autorisé." };
    await dbConnect();
    await Rating.deleteOne({ userId: session.user.id, movieId });
    revalidatePath(`/movies/${movieId}/reviews`);
    revalidatePath("/profile/ratings");
    return { success: "Note supprimée." };
  } catch (err) {
    console.error("Erreur deleteRating :", err);
    return { error: "Erreur lors de la suppression de la note." };
  }
}

// CREATE or UPDATE a review (used with useActionState)
export async function saveReview(
  prevState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Vous devez être connecté pour commenter." };

    const movieId = Number(formData.get("movieId"));
    const content = (formData.get("content") as string)?.trim();
    if (!isValidMovieId(movieId)) return { error: "Film invalide." };
    if (!content || content.length < 3) return { error: "Le commentaire est trop court." };
    if (content.length > 1000) return { error: "Maximum 1000 caractères." };

    await dbConnect();
    await Review.findOneAndUpdate(
      { userId: session.user.id, movieId },
      { content },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    revalidatePath(`/movies/${movieId}/reviews`);
    return { success: "Commentaire enregistré !" };
  } catch (err) {
    console.error("Erreur saveReview :", err);
    return { error: "Erreur lors de l'enregistrement du commentaire." };
  }
}

// DELETE own review
export async function deleteReview(movieId: number): Promise<ReviewActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Non autorisé." };
    await dbConnect();
    await Review.deleteOne({ userId: session.user.id, movieId });
    revalidatePath(`/movies/${movieId}/reviews`);
    return { success: "Commentaire supprimé." };
  } catch (err) {
    console.error("Erreur deleteReview :", err);
    return { error: "Erreur lors de la suppression du commentaire." };
  }
}

// Report a review (optional feature)
export async function reportReview(reviewId: string, reason: string): Promise<ReviewActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Non autorisé." };
    if (!reason?.trim()) return { error: "Merci d'indiquer une raison." };

    await dbConnect();
    const review = await Review.findById(reviewId);
    if (!review) return { error: "Commentaire introuvable." };
    if (review.userId.toString() === session.user.id)
      return { error: "Vous ne pouvez pas signaler votre propre commentaire." };

    await ReviewReport.create({
      reviewId,
      reporterUserId: session.user.id,
      reason: reason.trim().slice(0, 300),
    });
    return { success: "Merci, le commentaire a été signalé." };
  } catch (err: any) {
    if (err?.code === 11000) return { error: "Vous avez déjà signalé ce commentaire." };
    console.error("Erreur reportReview :", err);
    return { error: "Erreur lors du signalement." };
  }
}