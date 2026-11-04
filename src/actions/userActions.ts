"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export type ActionState = {
  error?: string | null;
  success?: string | null;
};

// 🔒 CLOISONNEMENT : Session obligatoire
async function checkAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Session expirée ou non autorisée.");
  }
  return session.user;
}

// 🔒 CLOISONNEMENT ADMInISTRATEUR : Rôle admin strict
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

// 🛠️ MODÉRATION ADMInISTRATEUR : ACTIVER / BANnIR (Mise à jour ciblée)
export async function toggleUserBan(userId: string): Promise<void> {
  try {
    await checkAdmin();
    await connectToDatabase();

    const target = await User.findById(userId);
    if (!target) return;

    // Utilisation de findByIdAndUpdate avec $set pour éviter les erreurs de validation globales
    await User.findByIdAndUpdate(userId, {
      $set: { valide: !target.valide }
    });

    revalidatePath("/admin/users");
  } catch (err) {
    console.error("Erreur action admin ban :", err);
  }
}

// 🛠️ MODÉRATION ADMInISTRATEUR 2 : OPTION B (Mise à jour ciblée)
export async function toggleUserRole(userId: string): Promise<void> {
  try {
    await checkAdmin();
    await connectToDatabase();

    const target = await User.findById(userId);
    const currentAdmin = await auth();

    // Sécurité : l'administrateur connecté ne peut pas s'auto-rétrograder
    if (!target || target._id.toString() === currentAdmin?.user?.id) return;

    const nextRole = target.role === "admin" ? "user" : "admin";

    // Utilisation de findByIdAndUpdate avec $set pour éviter les erreurs de validation globales
    await User.findByIdAndUpdate(userId, {
      $set: { role: nextRole }
    });

    revalidatePath("/admin/users");
  } catch (err) {
    console.error("Erreur action admin rôle :", err);
  }
}
