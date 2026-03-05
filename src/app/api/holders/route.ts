import { NextResponse } from "next/server";

const HELIUS_RPC = process.env.HELIUS_RPC_URL;
const TOKEN_MINT = process.env.NEXT_PUBLIC_TOKEN_MINT;

let cachedHolders: number | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  if (!HELIUS_RPC || !TOKEN_MINT || TOKEN_MINT === "YOUR_TOKEN_MINT_ADDRESS_HERE") {
    return NextResponse.json({ holders: null });
  }

  // Return cache if still fresh
  if (cachedHolders !== null && Date.now() - cacheTime < CACHE_TTL) {
    return NextResponse.json({ holders: cachedHolders });
  }

  try {
    let page = 1;
    let total = 0;

    while (true) {
      const res = await fetch(HELIUS_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: `holders-${page}`,
          method: "getTokenAccounts",
          params: {
            mint: TOKEN_MINT,
            limit: 1000,
            page,
            displayOptions: {},
          },
        }),
      });

      const data = await res.json();
      const accounts: unknown[] = data?.result?.token_accounts ?? [];

      total += accounts.length;

      // Last page reached
      if (accounts.length < 1000) break;

      page++;
      if (page > 200) break; // hard cap at 200k holders
    }

    cachedHolders = total;
    cacheTime = Date.now();

    return NextResponse.json({ holders: total });
  } catch (err) {
    console.error("[holders]", err);
    return NextResponse.json({ holders: cachedHolders ?? null });
  }
}