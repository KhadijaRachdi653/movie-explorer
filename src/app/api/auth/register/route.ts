import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    await connectToDatabase();

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return NextResponse.json({ error: "Cette adresse e-mail est déjà utilisée." }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // 💡 Insertion alignée sur 'name' et 'password' (Option B par défaut: user)
    const newUser = await User.create({
      email: email.toLowerCase().trim(),
      name: username.trim(),
      password: hashedPassword,
      verificationToken
    });

    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const activationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/activate?token=${verificationToken}`;

    await transporter.sendMail({
      from: '"Movie Explorer" <no-reply@movieexplorer.tn>',
      to: newUser.email,
      subject: "Activez votre compte Movie Explorer",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff; max-width: 600px; border-radius: 10px;">
          <h2 style="color: #3b82f6;">🎬 Bienvenue sur Movie Explorer !</h2>
          <p>Bonjour ${newUser.name},</p>
          <p>Votre compte étudiant a été créé. Cliquez ci-dessous pour valider votre e-mail :</p>
          <div style="margin: 20px 0; text-align: center;">
            <a href="${activationUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Activer mon compte
            </a>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Compte créé." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne serveur." }, { status: 500 });
  }
}
