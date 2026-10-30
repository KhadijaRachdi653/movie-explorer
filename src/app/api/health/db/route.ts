
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectToDatabase();

    return NextResponse.json({
      ok: true,
      database: mongoose.connection.name,
      state: "connected",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}

