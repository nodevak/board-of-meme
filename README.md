# Board of Meme 🎭

> A token-gated meme canvas for Solana SPL token holders.  
> Your bag size determines your tile size on the board.

---

## Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | Next.js 14 (App Router)       |
| Wallet   | Solana Wallet Adapter (Phantom, Solflare, Backpack, Coinbase) |
| RPC      | Helius                        |
| Database | Neon (PostgreSQL)             |
| Hosting  | Railway                       |

---

## Tier System

| Tier     | Tokens Required | Tile Size |
|----------|-----------------|-----------|
| 🐋 Whale   | 1,000,000+      | 340×340   |
| 🦈 Shark   | 500,000+        | 280×280   |
| 🐬 Dolphin | 100,000+        | 210×210   |
| 🐟 Fish    | 50,000+         | 160×160   |
| 🦐 Shrimp  | 10,000+         | 120×120   |
| 🦠 Plankton| Any amount      | 88×88     |

---

## Quick Deploy

### 1. Clone & configure

```bash
git clone https://github.com/YOUR_USERNAME/board-of-meme.git
cd board-of-meme
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
DATABASE_URL=postgresql://...         # From neon.tech
HELIUS_API_KEY=your_key               # From helius.dev
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key
NEXT_PUBLIC_TOKEN_MINT=YOUR_MINT_ADDR # Your SPL token mint address
NEXT_PUBLIC_TOKEN_NAME=YOURTICKER     # e.g. DOGE, BONK, etc.
NEXT_PUBLIC_MIN_TOKENS=1              # Min tokens required to post
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

### 2. Initialize the database

```bash
npm install
npm run dev
# Then visit: http://localhost:3000/api/migrate
```

### 3. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 4. Deploy to Railway

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select your repo
4. Add all env vars from `.env.example` in Railway's **Variables** tab
5. Railway auto-detects Next.js and deploys

> After first deploy, visit `https://your-app.railway.app/api/migrate` once to create DB tables.

---

## Neon DB Setup

1. Go to [neon.tech](https://neon.tech) → create a project
2. Copy the **Connection String** (looks like `postgresql://user:pass@host/db?sslmode=require`)
3. Paste it as `DATABASE_URL` in your env vars

The app auto-creates the `posts` table on first request via `/api/migrate`.

---

## Helius Setup

1. Go to [helius.dev](https://helius.dev) → create an API key
2. Set `HELIUS_API_KEY` and `HELIUS_RPC_URL` in your env vars
3. The balance check uses `getTokenAccountsByOwner` to verify holdings on-chain

---

## Features

- ✅ Wallet connect (Phantom, Solflare, Backpack, Coinbase)
- ✅ On-chain token balance verification via Helius RPC
- ✅ Proportional tile sizing based on holdings tier
- ✅ Image upload (base64, max 2MB) or text posts
- ✅ 1 post per wallet per 24 hours (rate limit)
- ✅ Hover to reveal wallet + token info
- ✅ Click tile to view full-size
- ✅ Posts sorted by token weight (whales on top)
- ✅ Sticky header with live ticker
- ✅ Scanline retro aesthetic

---

## API Endpoints

| Method | Path                      | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | `/api/posts`              | Fetch all posts (sorted by tokens) |
| POST   | `/api/posts`              | Submit a new post                  |
| GET    | `/api/balance?wallet=...` | Check token balance via Helius     |
| GET    | `/api/migrate`            | Initialize DB tables (run once)    |

---

## Customization

All tier thresholds and tile sizes are in `src/lib/utils.ts` → `TIER_THRESHOLDS`.  
Colors, fonts, and layout are in each component's inline styles.
