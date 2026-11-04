import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    // 🔑 Extraction du token présent dans l'URL du bouton vert cliqué
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse("Jeton de sécurité manquant.", { status: 400 });
    }

    await connectToDatabase();

    // 🔒 Rechercher l'utilisateur possédant ce jeton unique dans MongoDB
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return new NextResponse("Ce lien d'activation est invalide ou a déjà été utilisé.", { status: 400 });
    }

    // 💡 VALIDATION : Activation réussie du compte et destruction du token à usage unique
    user.valide = true;
    user.verificationToken = null;
    await user.save();

    // 🚀 REDIRECTION : On redirige l'utilisateur vers la page de connexion avec un indicateur de succès
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/login?activated=true`);

  } catch (error) {
    console.error("Erreur lors de l'activation :", error);
    return new NextResponse("Une erreur technique interne est survenue.", { status: 500 });
  }
}
