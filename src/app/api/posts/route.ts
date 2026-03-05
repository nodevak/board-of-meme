import { NextRequest, NextResponse } from "next/server";
import { sql, initDB, Post } from "@/lib/db";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET ?? "";

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

export async function POST(req: NextRequest) {
  try {
    await initDB();

    const body = await req.json();
    const { wallet, tokens, type, content, name } = body;

    const isAdmin = ADMIN_WALLET !== "" && wallet === ADMIN_WALLET;

    if (!wallet || typeof wallet !== "string" || wallet.length > 44) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }
    if (!isAdmin && (!tokens || typeof tokens !== "number" || tokens < 1)) {
      return NextResponse.json({ error: "No token balance" }, { status: 403 });
    }
    if (!["image", "text"].includes(type)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const maxBytes = type === "image" ? 2_500_000 : 2_000;
    if (content.length > maxBytes) {
      return NextResponse.json(
        { error: type === "image" ? "Image too large (max ~1.8MB)" : "Text too long (max 2000 chars)" },
        { status: 413 }
      );
    }

    // Rate limit: skip for admin
    if (!isAdmin) {
      const existing = await sql`
        SELECT id FROM posts
        WHERE wallet = ${wallet}
          AND created_at > NOW() - INTERVAL '24 hours'
        LIMIT 1
      `;
      if (existing.length > 0) {
        return NextResponse.json({ error: "You can post once every 24 hours" }, { status: 429 });
      }
    }

    const finalTokens = isAdmin && (!tokens || tokens < 1) ? 999999999 : tokens;

    const [post] = await sql<Post[]>`
      INSERT INTO posts (wallet, tokens, type, content, name)
      VALUES (${wallet}, ${finalTokens}, ${type}, ${content}, ${name ?? null})
      RETURNING *
    `;

    return NextResponse.json({ post }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/posts]", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}