import { NextResponse } from "next/server";
import { getGenres } from "@/modules/discovery/discovery.service";

// GET /api/search/genres — liste des genres pour le filtre (public)
export async function GET() {
  try {
    const genres = await getGenres();
    return NextResponse.json({ genres }, { status: 200 });
  } catch (err) {
    console.error("Erreur /api/search/genres :", err);
    return NextResponse.json({ error: "Le service de films est momentanément indisponible." }, { status: 502 });
  }
}
