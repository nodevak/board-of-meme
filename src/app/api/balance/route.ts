import { NextRequest, NextResponse } from "next/server";

const HELIUS_RPC = process.env.HELIUS_RPC_URL;
const TOKEN_MINT = process.env.NEXT_PUBLIC_TOKEN_MINT;

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Missing wallet param", tokens: 0 }, { status: 400 });
  }

  // If not configured, return 0 gracefully (admin can still post)
  if (!HELIUS_RPC || !TOKEN_MINT || TOKEN_MINT === "YOUR_TOKEN_MINT_ADDRESS_HERE") {
    console.warn("[balance] Helius RPC or TOKEN_MINT not configured");
    return NextResponse.json({ tokens: 0, wallet, warning: "RPC not configured" });
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
    });

    if (!res.ok) {
      console.error("[balance] Helius HTTP error:", res.status);
      return NextResponse.json({ tokens: 0, wallet });
    }

    const data = await res.json();

    if (data.error) {
      console.error("[balance] Helius RPC error:", data.error);
      return NextResponse.json({ tokens: 0, wallet });
    }

    const accounts = data.result?.value ?? [];
    const totalUiAmount = accounts.reduce((sum: number, acc: any) => {
      return sum + (acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0);
    }, 0);

    return NextResponse.json({ tokens: Math.floor(totalUiAmount), wallet });
  } catch (err) {
    console.error("[GET /api/balance]", err);
    // Return 0 gracefully instead of crashing — admin bypass still works
    return NextResponse.json({ tokens: 0, wallet });
  }
}