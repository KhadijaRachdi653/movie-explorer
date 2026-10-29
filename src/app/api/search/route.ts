import { NextRequest, NextResponse } from "next/server";
import { searchQuerySchema } from "@/modules/discovery/discovery.schema";
import { searchMovies } from "@/modules/discovery/discovery.service";

// GET /api/search?query=&genre=&year=&minRating=&sortBy=&page=
// Public (pas d'authentification requise)
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = searchQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const data = await searchMovies(parsed.data);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Erreur /api/search :", err);
    return NextResponse.json({ error: "Le service de films est momentanément indisponible." }, { status: 502 });
  }
}
