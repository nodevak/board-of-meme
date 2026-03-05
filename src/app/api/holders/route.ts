import { NextResponse } from "next/server";

const TOKEN_MINT   = process.env.NEXT_PUBLIC_TOKEN_MINT;
const BIRDEYE_KEY  = process.env.BIRDEYE_API_KEY; // optional, works without key on free tier

let cachedHolders: number | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  if (!TOKEN_MINT || TOKEN_MINT === "YOUR_TOKEN_MINT_ADDRESS_HERE") {
    return NextResponse.json({ holders: null });
  }

  // Return cache if fresh
  if (cachedHolders !== null && Date.now() - cacheTime < CACHE_TTL) {
    return NextResponse.json({ holders: cachedHolders });
  }

  try {
    const headers: Record<string, string> = {
      "accept": "application/json",
      "x-chain": "solana",
    };
    if (BIRDEYE_KEY) headers["X-API-KEY"] = BIRDEYE_KEY;

    const res = await fetch(
      `https://public-api.birdeye.so/defi/token_overview?address=${TOKEN_MINT}`,
      { headers }
    );

    const data = await res.json();

    // Birdeye returns holder count in data.data.holder
    const holders = data?.data?.holder ?? null;

    if (holders !== null) {
      cachedHolders = holders;
      cacheTime = Date.now();
    }

    return NextResponse.json({ holders });
  } catch (err) {
    console.error("[GET /api/holders]", err);
    return NextResponse.json({ holders: cachedHolders });
  }
}