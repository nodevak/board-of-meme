import { NextRequest, NextResponse } from "next/server";
import { sql, initDB, Post } from "@/lib/db";

// ─── GET /api/posts ───────────────────────────────────────────────────────────
export async function GET() {
  try {
    await initDB();
    const posts = await sql<Post[]>`
      SELECT id, wallet, tokens, type, content, name, created_at
      FROM posts
      ORDER BY tokens DESC, created_at DESC
      LIMIT 200
    `;
    return NextResponse.json({ posts });
  } catch (err) {
    console.error("[GET /api/posts]", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// ─── POST /api/posts ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    await initDB();

    const body = await req.json();
    const { wallet, tokens, type, content, name } = body;

    // ── Validation ──
    if (!wallet || typeof wallet !== "string" || wallet.length > 44) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }
    if (!tokens || typeof tokens !== "number" || tokens < 1) {
      return NextResponse.json({ error: "No token balance" }, { status: 403 });
    }
    if (!["image", "text"].includes(type)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    // ── Content size guard (images ~2MB base64 max) ──
    const maxBytes = type === "image" ? 2_500_000 : 2_000;
    if (content.length > maxBytes) {
      return NextResponse.json(
        { error: type === "image" ? "Image too large (max ~1.8MB)" : "Text too long (max 2000 chars)" },
        { status: 413 }
      );
    }

    // ── Rate limit: 1 post per wallet per day ──
    const existing = await sql`
      SELECT id FROM posts
      WHERE wallet = ${wallet}
        AND created_at > NOW() - INTERVAL '24 hours'
      LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You can post once every 24 hours" },
        { status: 429 }
      );
    }

    // ── Insert ──
    const [post] = await sql<Post[]>`
      INSERT INTO posts (wallet, tokens, type, content, name)
      VALUES (${wallet}, ${tokens}, ${type}, ${content}, ${name ?? null})
      RETURNING *
    `;

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/posts]", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
