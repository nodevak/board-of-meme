import { NextResponse } from "next/server";
import { initDB } from "@/lib/db";

// GET /api/migrate  — run once to set up tables
// Protect with a secret in production if needed
export async function GET() {
  try {
    await initDB();
    return NextResponse.json({ ok: true, message: "Database initialized successfully" });
  } catch (err) {
    console.error("[migrate]", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
