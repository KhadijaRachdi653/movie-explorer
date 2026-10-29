"use server";

import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { auth, signIn } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionState = {
  error?: string | null;
  success?: string | null;
  isValid?: boolean | null;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,10}$/;

export async function registerUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await dbConnect();

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim()?.toLowerCase();
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
      return { error: "Tous les champs sont obligatoires." };
    }

    if (!emailRegex.test(email)) {
      return { error: "Veuillez fournir une adresse e-mail valide (contenant @ et un domaine)." };
    }

    if (!passwordRegex.test(password)) {
      return {
        error: "Le mot de passe doit contenir entre 6 et 10 caractères, inclure au moins une majuscule, un chiffre et un caractère spécial."
      };
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return { error: "Cet e-mail est déjà utilisé." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newDbUser = await User.create({ name, email, password: hashedPassword });

    console.log("➡️ [SUCCESS] Nouvel utilisateur créé dans MongoDB :", newDbUser.email);

    return { success: "Compte créé avec succès !" };
  } catch (err: any) {
    console.error("Erreur serveur détaillée :", err);
    return { error: "Une erreur est survenue lors de l'inscription." };
  }
}

export async function verifyUserCredentials(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await dbConnect();

    const email = (formData.get("email") as string)?.trim()?.toLowerCase();
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Veuillez remplir tous les champs." };
    }

    if (!emailRegex.test(email)) {
      return { error: "Le format de l'adresse e-mail n'est pas valide." };
    }

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (!user) {
      return {
        error: "Ce compte n'existe pas dans la base. Souhaitez-vous créer un compte ?"
      };
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return { error: "Mot de passe incorrect. Merci d'insérer des paramètres valides." };
    }

    try {
      await signIn("credentials", {
        email: user.email,
        password: password,
        redirect: false,
      });
    } catch (authError) {
      console.error("Erreur interne Auth.js :", authError);
      return { error: "Erreur lors de la création de la session d'authentification." };
    }

    return { isValid: true, success: "Connexion réussie !" };

  } catch (err) {
    console.error("Erreur serveur détaillée :", err);
    return { error: "Une erreur technique est survenue sur le serveur." };
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Non autorisé." };

    await dbConnect();
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { error: "Le nom ne peut pas être vide." };

    await User.findByIdAndUpdate(session.user.id, { name });
    revalidatePath("/profile");
    return { success: "Profil mis à jour avec succès !" };
  } catch (err) {
    console.error("Erreur mise à jour profil :", err);
    return { error: "Erreur lors de la modification du profil." };
  }
}

export async function deleteAccount() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Non autorisé." };

    await dbConnect();
    await User.findByIdAndDelete(session.user.id);

    return { success: "Compte supprimé définitivement." };
  } catch (err) {
    console.error("Erreur suppression compte :", err);
    return { error: "Erreur lors de la suppression du compte." };
  }
}

export async function resetUserPassword(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await dbConnect();

    const email = (formData.get("email") as string)?.trim()?.toLowerCase();
    const newPassword = formData.get("password") as string;

    if (!email || !newPassword) {
      return { error: "Veuillez remplir tous les champs." };
    }

    if (!emailRegex.test(email)) {
      return { error: "Le format de l'adresse e-mail n'est pas valide." };
    }

    if (!passwordRegex.test(newPassword)) {
      return {
        error: "Le nouveau mot de passe doit contenir entre 6 et 10 caractères, inclure au moins une majuscule, un chiffre et un caractère spécial."
      };
    }

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (!user) {
      return { error: "Aucun compte n'est associé à cette adresse e-mail." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    console.log(`➡️ [SUCCESS] Mot de passe réinitialisé pour : ${user.email}`);

    return { success: "Votre mot de passe a été réinitialisé avec succès ! Vous pouvez vous connecter." };
  } catch (err) {
    console.error("Erreur réinitialisation :", err);
    return { error: "Une erreur technique est survenue lors de la réinitialisation." };
  }
}

export async function getAllUsers() {
  try {
    const session = await auth();

    if (!session || (session.user as any).role !== "admin") {
      throw new Error("Non autorisé.");
    }

    await dbConnect();

    const users = await User.find({}, "name email role createdAt").lean();

    return users.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role || "user",
      createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString()
    }));
  } catch (err) {
    console.error("Erreur récupération utilisateurs admin :", err);
    return [];
  }
}
