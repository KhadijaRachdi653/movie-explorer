import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "L'adresse e-mail est obligatoire." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // 🔍 RECHERCHE STRICTE PAR REGEX : Gère les majuscules de la BD Cloud Atlas sans distinction de casse
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${email.trim()}$`, "i") },
    });

    // Règle d'or de sécurité : on affiche le même message pour éviter le vol de comptes
    if (!user) {
      return NextResponse.json({
        message:
          "Si ce compte existe, un e-mail d'activation sécurisé a été envoyé.",
      });
    }

    // 🔑 Génération du Jeton unique d'activation temporaire
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 3600000); // Expire dans 1 heure

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    // 📬 Configuration SMTP pour votre Sandbox Mailtrap
    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: '"Movie Explorer" <no-reply@movieexplorer.tn>',
      to: user.email,
      subject: "Activation et Réinitialisation de votre compte",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff; max-width: 600px; border-radius: 10px;">
          <h2 style="color: #3b82f6;">🎬 Activation Movie Explorer</h2>
          <p>Bonjour ${user.name},</p>
          <p>Vous avez soumis une demande de réinitialisation ou d'activation de vos paramètres de compte.</p>
          <p>Veuillez cliquer sur le bouton ci-dessous pour configurer vos nouveaux accès :</p>
          <div style="margin: 20px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Activer mon mot de passe
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px;">Ce lien d'activation expirera automatiquement dans 1 heure.</p>
        </div>
      `,
    };

    // Envoi du mail
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      message:
        "Si ce compte existe, un e-mail d'activation sécurisé a été envoyé.",
    });
  } catch (error) {
    console.error("Erreur d'envoi Nodemailer :", error);
    return NextResponse.json(
      { error: "Une erreur technique est survenue sur le serveur." },
      { status: 500 },
    );
  }
}
