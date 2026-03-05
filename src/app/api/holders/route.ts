import { NextResponse } from "next/server";

const HELIUS_RPC   = process.env.HELIUS_RPC_URL;
const TOKEN_MINT   = process.env.NEXT_PUBLIC_TOKEN_MINT;

export async function GET() {
  if (!HELIUS_RPC || !TOKEN_MINT || TOKEN_MINT === "YOUR_TOKEN_MINT_ADDRESS_HERE") {
    return NextResponse.json({ holders: null });
  }

  try {
    // Helius getTokenAccounts DAS method — returns total holder count
    const res = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "holders",
        method: "getTokenAccounts",
        params: {
          mint: TOKEN_MINT,
          limit: 1,
          page: 1,
        },
      }),
      next: { revalidate: 120 }, // cache 2 minutes
    });

    const data = await res.json();

    // Helius returns { result: { total: number, token_accounts: [...] } }
    const total = data?.result?.total ?? null;

    return NextResponse.json({ holders: total });
  } catch (err) {
    console.error("[GET /api/holders]", err);
    return NextResponse.json({ holders: null });
  }
}