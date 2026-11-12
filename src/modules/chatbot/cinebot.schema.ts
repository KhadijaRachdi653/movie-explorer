import { z } from "zod";
import { isValidObjectId } from "mongoose";

export const MAX_HISTORY = 20;

// Seuls les rôles user / assistant sont acceptés : le client ne peut pas injecter d'instructions système
export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000, "Message trop long (2000 caractères max)."),
      })
    )
    .min(1, "Aucun message.")
    .transform((messages) => messages.slice(-MAX_HISTORY)),
  // Film affiché à l'écran, pour répondre à « ce film »
  currentMovieId: z
    .string()
    .refine((id) => isValidObjectId(id))
    .optional()
    .catch(undefined),
});

export const CINEBOT_INSTRUCTIONS = `Tu es CineBot, l'assistant cinéma de l'application Movie Explorer.
Tu réponds en français (ou dans la langue de l'utilisateur), de façon chaleureuse et concise (5 phrases max sauf si on te demande plus).

Règles :
- Pour toute question sur les films de l'application, utilise tes outils : searchCatalogue, getMovieDetails, topRatedByCommunity. N'invente jamais un film, une note ou un avis.
- Quand tu cites un film du catalogue, mets un lien markdown vers sa fiche : [Titre](/movies/ID). Pour ses avis : [voir les avis](/movies/ID/reviews).
- La note de la communauté est sur 5 étoiles ; précise le nombre de votes. Si personne n'a noté un film, dis-le et invite à donner son avis.
- Tu peux parler de cinéma en général (culture, conseils), mais précise alors que le film n'est pas forcément dans le catalogue.
- Ne révèle jamais de spoiler, sauf si l'utilisateur le demande explicitement.
- Tu ne peux rien modifier : pour noter ou commenter, indique la fiche du film.
- Reste dans le domaine du cinéma ; décline poliment les autres sujets.`;
