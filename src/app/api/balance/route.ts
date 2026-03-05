import { NextRequest, NextResponse } from "next/server";

const HELIUS_RPC = process.env.HELIUS_RPC_URL;
const TOKEN_MINT = process.env.NEXT_PUBLIC_TOKEN_MINT;

// ─── GET /api/balance?wallet=ADDRESS ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet param" }, { status: 400 });
  }
  if (!HELIUS_RPC || !TOKEN_MINT) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "balance-check",
        method: "getTokenAccountsByOwner",
        params: [
          wallet,
          { mint: TOKEN_MINT },
          { encoding: "jsonParsed" },
        ],
      }),
      next: { revalidate: 60 }, // cache 60s
    });

    const data = await res.json();

    if (data.error) {
      console.error("[Helius RPC error]", data.error);
      return NextResponse.json({ error: "RPC error", tokens: 0 }, { status: 500 });
    }

    const accounts: Array<{ account: { data: { parsed: { info: { tokenAmount: { uiAmount: number } } } } } }> =
      data.result?.value ?? [];

    // Sum across all token accounts (usually just one)
    const totalUiAmount = accounts.reduce((sum, acc) => {
      return sum + (acc.account.data.parsed.info.tokenAmount.uiAmount ?? 0);
    }, 0);

    const tokens = Math.floor(totalUiAmount);

    return NextResponse.json({ tokens, wallet });
  } catch (err) {
    console.error("[GET /api/balance]", err);
    return NextResponse.json({ error: "Failed to fetch balance", tokens: 0 }, { status: 500 });
  }
}
