import { NextResponse } from "next/server";
import { sql, initDB } from "@/lib/db";

export async function GET() {
  const results: Record<string, unknown> = {};

  results.env = {
    DATABASE_URL: process.env.DATABASE_URL ? "SET ✓" : "MISSING ✗",
    HELIUS_RPC_URL: process.env.HELIUS_RPC_URL ? "SET ✓" : "MISSING ✗",
    TOKEN_MINT: process.env.NEXT_PUBLIC_TOKEN_MINT ?? "MISSING ✗",
    TOKEN_NAME: process.env.NEXT_PUBLIC_TOKEN_NAME ?? "MISSING ✗",
    ADMIN_WALLET: process.env.NEXT_PUBLIC_ADMIN_WALLET ?? "MISSING ✗",
  };

  try {
    await initDB();
    const rows = await sql`SELECT COUNT(*) as count FROM posts`;
    results.database = { status: "OK ✓", postCount: rows[0].count };
  } catch (err) {
    results.database = { status: "ERROR ✗", error: String(err) };
  }

  return NextResponse.json(results);
}