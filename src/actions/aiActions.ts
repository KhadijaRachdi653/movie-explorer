"use server";

import { generateText } from "ai";
import { withGemini } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { getMovie } from "@/modules/movies/movie.service";
import { getRatingSummary, listReviews } from "@/modules/reviews/review.service";
import { isValidObjectId } from "mongoose";

export type AiResult = { text?: string; error?: string };

const AI_ERROR = "L'assistant IA est momentanément indisponible. Réessayez dans un instant.";

// ✨ Aide à la rédaction : transforme quelques mots-clés en avis rédigé (generateText, comme dans le Workshop 5)
export async function generateReviewDraft(movieId: string, score: number | null, notes: string): Promise<AiResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Connectez-vous pour utiliser l'assistant." };
  if (!isValidObjectId(movieId)) return { error: "Film invalide." };
  if (notes.trim().length < 2) return { error: "Écrivez d'abord quelques mots-clés (ex. « visuels magnifiques, fin trop longue »)." };

  try {
    const movie = await getMovie(movieId);
    const { text } = await withGemini("aide à la rédaction", (model, abortSignal) =>
      generateText({
        model,
        abortSignal,
        maxRetries: 0,
        prompt: `Rédige un avis de spectateur en français sur le film « ${movie.title} » (${movie.year}).
Note donnée : ${score ? `${score}/5` : "non précisée"}. Idées de l'utilisateur : « ${notes.trim().slice(0, 500)} ».
Consignes : 2 à 4 phrases, à la première personne, ton naturel et personnel, cohérent avec la note, sans spoiler, sans titre ni guillemets ni markdown. Maximum 900 caractères.`,
      })
    );
    return { text: text.trim().slice(0, 1000) };
  } catch (err) {
    console.error("Erreur generateReviewDraft :", err);
    return { error: AI_ERROR };
  }
}

// Résumé mis en cache par film tant que le nombre d'avis ne change pas (préserve le quota Gemini)
const summaryCache: Map<string, { reviews: number; text: string }> = ((
  globalThis as { reviewSummaryCache?: Map<string, { reviews: number; text: string }> }
).reviewSummaryCache ??= new Map());

// ✨ « Ce qu'en pensent les spectateurs » : synthèse des avis d'un film
export async function summarizeReviews(movieId: string): Promise<AiResult> {
  if (!isValidObjectId(movieId)) return { error: "Film invalide." };
  try {
    const [movie, summary, { reviews, total }] = await Promise.all([
      getMovie(movieId),
      getRatingSummary(movieId),
      listReviews({ movieId, sort: "likes", page: 1, limit: 40 }),
    ]);
    if (total < 2) return { error: "Il faut au moins 2 avis pour générer un résumé." };
    const cached = summaryCache.get(movieId);
    if (cached?.reviews === total) return { text: cached.text };

    const corpus = reviews
      .map((r) => `- ${r.score ? `${r.score}/5` : "sans note"}, ${r.likeCount} like(s)${r.spoiler ? ", SPOILER" : ""} : ${r.content}`)
      .join("\n");
    const { text } = await withGemini("résumé des avis", (model, abortSignal) =>
      generateText({
        model,
        abortSignal,
        maxRetries: 0,
        prompt: `Voici les avis des spectateurs sur le film « ${movie.title} » (moyenne ${summary.average}/5 sur ${summary.count} notes) :
${corpus}

Fais une synthèse en français de ce qu'en pensent les spectateurs : 2 à 3 phrases, puis une ligne « 👍 » avec les points forts et une ligne « 👎 » avec les points faibles cités.
Ne révèle aucun élément des avis marqués SPOILER. Pas de markdown, pas de titre.`,
      })
    );
    const result = text.trim();
    summaryCache.set(movieId, { reviews: total, text: result });
    return { text: result };
  } catch (err) {
    console.error("Erreur summarizeReviews :", err);
    return { error: AI_ERROR };
  }
}
