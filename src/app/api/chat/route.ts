import { isStepCount, streamText } from "ai";
import { EmptyResponseError, streamWithGemini } from "@/lib/ai";
import dbConnect from "@/lib/mongodb";
import Movie, { type MovieDoc } from "@/modules/movies/movie.model";
import {
  CINEBOT_INSTRUCTIONS,
  chatRequestSchema,
} from "@/modules/chatbot/cinebot.schema";
import { cinebotTools } from "@/modules/chatbot/cinebot.tools";
import { readJson } from "@/modules/discovery/http";
import { auth } from "@/lib/auth";

export const maxDuration = 30;

// Contexte ajouté aux instructions : prénom de l'utilisateur et film affiché à l'écran
async function contextFor(currentMovieId?: string): Promise<string> {
  const lines: string[] = [];
  const session = await auth();
  if (session?.user?.name)
    lines.push(`L'utilisateur s'appelle ${session.user.name.split(" ")[0]}.`);
  if (currentMovieId) {
    await dbConnect();
    const movie = await Movie.findById(currentMovieId).lean<MovieDoc>();
    if (movie)
      lines.push(
        `Il consulte la fiche du film « ${movie.title} » (movieId ${currentMovieId}) : « ce film » désigne celui-ci.`,
      );
  }
  return lines.length ? `\n\nContexte :\n- ${lines.join("\n- ")}` : "";
}

// POST /api/chat — conversation en streaming avec CineBot (Gemini via le Vercel AI SDK)
export async function POST(req: Request) {
  const parsed = chatRequestSchema.safeParse(
    await readJson(req).catch(() => null),
  );
  if (!parsed.success) {
    return new Response(
      parsed.error.issues[0]?.message ?? "Requête invalide.",
      { status: 400 },
    );
  }
  try {
    const { messages, currentMovieId } = parsed.data;
    const instructions =
      CINEBOT_INSTRUCTIONS + (await contextFor(currentMovieId));
    const stream = await streamWithGemini("chat", (model, abortSignal) =>
      streamText({
        model,
        instructions,
        messages,
        tools: cinebotTools,
        stopWhen: isStepCount(4),
        maxRetries: 0,
        abortSignal,
        onError: () => {}, // erreurs gérées par streamWithGemini (bascule de modèle)
      }),
    );
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    if (error instanceof EmptyResponseError) {
      return new Response(
        "Je n'ai pas trouvé de réponse à cette question. Pouvez-vous la reformuler ?",
        {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        },
      );
    }
    console.error("Chat API Error:", error);
    return new Response(
      "CineBot est momentanément indisponible. Réessayez dans un instant.",
      { status: 503 },
    );
  }
}
