"use server";

import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import User from "@/models/User";

// 🔒 Structure de retour standardisée pour l'UI
export type PushActionState = {
  error?: string | null;
  success?: string | null;
};

/**
 * Enregistre ou met à jour l'abonnement Push d'un administrateur en base de données
 */
export async function savePushSubscription(
  subscriptionInput: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }
): Promise<PushActionState> {
  try {
    // 1. 🔒 Cloisonnement de sécurité : Session active obligatoire
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Session expirée ou non autorisée." };
    }

    await connectToDatabase();

    // 2. 🛡️ Vérification stricte des droits d'administration
    const dbUser = await User.findById(session.user.id);
    if (!dbUser || dbUser.role !== "admin") {
      return { error: "Accès refusé. Réservé aux administrateurs." };
    }

    // 3. 💾 Enregistrement chirurgical (Upsert) pour éviter les doublons de terminaux
    await PushSubscription.findOneAndUpdate(
      { adminId: dbUser._id },
      {
        $set: {
          endpoint: subscriptionInput.endpoint,
          keys: {
            p256dh: subscriptionInput.keys.p256dh,
            auth: subscriptionInput.keys.auth,
          },
        },
      },
      { upsert: true, new: true } // Crée le document s'il n'existe pas encore
    );

    return { success: "Votre terminal d'administration a été lié avec succès au serveur de Push CINEA." };
  } catch (error: any) {
    console.error("Erreur enregistrement PushSubscription :", error);
    return { error: "Une erreur technique est survenue lors de l'appairage." };
  }
}
