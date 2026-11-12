"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import PushSubscription from "@/models/PushSubscription";
import bcrypt from "bcryptjs";
import webpush from "web-push";

export type ActionState = {
  error?: string | null;
  success?: string | null;
};

// 💡 CONFIGURATION INITIALE DU MOTEUR WEB-PUSH NATIF DE LA PWA
if (
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn("⚠️ Les variables VAPID ne sont pas encore totalement initialisées.");
}

// 🔒 CLOISONNEMENT : Session obligatoire
async function checkAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Session expirée ou non autorisée.");
  }
  return session.user;
}

// 🔒 CLOISONNEMENT ADMINISTRATEUR : Rôle admin strict
async function checkAdmin() {
  const user = await checkAuth();
  await connectToDatabase();
  const dbUser = await User.findById(user.id);
  if (!dbUser || dbUser.role !== "admin") {
    throw new Error("Accès refusé. Réservé aux administrateurs.");
  }
}

// 🛠️ MISE À JOUR DU PROFIL (Modifie le champ 'name')
export async function updateProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await checkAuth();
    const name = (formData.get("username") as string)?.trim() ?? "";

    if (name.length < 3) {
      return { error: "Le nom d'utilisateur doit faire au moins 3 caractères." };
    }

    await connectToDatabase();
    await User.findByIdAndUpdate(user.id, { name });
    revalidatePath("/profile");
    return { success: "Profil mis à jour avec succès !" };
  } catch (err: any) {
    return { error: err.message || "Erreur lors de la modification." };
  }
}

// 🛠️ MODIFICATION DU MOT DE PASSE (Modifie le champ 'password')
export async function changePassword(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await checkAuth();
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!currentPassword || !newPassword) {
      return { error: "Tous les champs sont obligatoires." };
    }

    if (newPassword.length < 8) {
      return { error: "Le nouveau mot de passe doit faire au moins 8 caractères." };
    }

    await connectToDatabase();
    const dbUser = await User.findById(user.id);
    if (!dbUser) {
      return { error: "Utilisateur introuvable." };
    }

    const isMatch = await bcrypt.compare(currentPassword, dbUser.password);
    if (!isMatch) {
      return { error: "Le mot de passe actuel est incorrect." };
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(user.id, { password: hashedPassword });
    return { success: "Votre mot de passe a été modifié avec succès !" };
  } catch (err: any) {
    return { error: err.message || "Une erreur technique est survenue." };
  }
}

// 🛠️ GESTION DE L'ABONNEMENT STREAMING + PROPULSION DU PUSH PHYSIQUE NATIF
export async function toggleSubscription(): Promise<ActionState> {
  try {
    const user = await checkAuth();
    await connectToDatabase();

    const dbUser = await User.findById(user.id);
    if (!dbUser) {
      return { error: "Cinéphile introuvable." };
    }

    const nextSubscriptionState = !dbUser.isSubscribed;

    // 1. Mise à jour de l'état d'abonnement en base de données
    await User.findByIdAndUpdate(user.id, {
      $set: { isSubscribed: nextSubscriptionState }
    });

    // 2. Préparation du payload JSON textuel pour la bulle d'alerte OS
    const notificationPayload = JSON.stringify({
      title: "Alerte Système CINEA 🎬",
      body: nextSubscriptionState
        ? `✨ Le membre ${dbUser.name} vient d'activer son accès Premium Streaming.`
        : `👤 Le membre ${dbUser.name} a résilié son abonnement Streaming.`,
      userId: dbUser._id.toString() // Transmis pour permettre la redirection au clic
    });

    // 3. 📡 RÉCUPÉRATION ET PROPULSION DU PUSH VERS LES NAVIGATEURS DES ADMINS
    const activeSubscriptions = await PushSubscription.find({});

    // Envoi asynchrone parallélisé vers tous les terminaux enregistrés
    const pushPromises = activeSubscriptions.map(async (sub) => {
      try {
        if (!sub.keys?.p256dh || !sub.keys?.auth) return; // abonnement incomplet : ignoré
        const pushTarget = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth
          }
        };

        // Envoi physique chiffré
        await webpush.sendNotification(pushTarget, notificationPayload);
      } catch (pushError: any) {
        // Sécurité PWA : Si le navigateur de l'admin a expiré ou supprimé l'autorisation (Status 410), on nettoie la base
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          await PushSubscription.findByIdAndDelete(sub._id);
        }
        console.error("Échec d'envoi d'un push vers un terminal :", pushError.message);
      }
    });

    await Promise.all(pushPromises);

    revalidatePath("/profile");
    revalidatePath("/admin/users");

    return {
      success: nextSubscriptionState
        ? "Félicitations ! Votre accès Premium Streaming est désormais actif."
        : "Votre abonnement a été résilié. Vous repassez en compte Cinéphile gratuit."
    };
  } catch (err: any) {
    return { error: err.message || "Une erreur sur le serveur de Push." };
  }
}

// 🛠️ MODÉRATION ADMINISTRATEUR : ACTIVER / BANNIR
export async function toggleUserBan(userId: string): Promise<void> {
  try {
    await checkAdmin();
    await connectToDatabase();

    const target = await User.findById(userId);
    if (!target) return;

    await User.findByIdAndUpdate(userId, {
      $set: { valide: !target.valide }
    });

    revalidatePath("/admin/users");
  } catch (err) {
    console.error("Erreur action admin ban :", err);
  }
}

// 🛠️ MODÉRATION ADMINISTRATEUR 2 : ATTRIBUTION DE RÔLE
export async function toggleUserRole(userId: string): Promise<void> {
  try {
    await checkAdmin();
    await connectToDatabase();

    const target = await User.findById(userId);
    const currentAdmin = await auth();

    if (!target || target._id.toString() === currentAdmin?.user?.id) return;

    const nextRole = target.role === "admin" ? "user" : "admin";

    await User.findByIdAndUpdate(userId, {
      $set: { role: nextRole }
    });

    revalidatePath("/admin/users");
  } catch (err) {
    console.error("Erreur action admin rôle :", err);
  }
}
