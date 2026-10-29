import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

    return NextResponse.json({ message: "Un lien de réinitialisation vous a été envoyé par e-mail." });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}