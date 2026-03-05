"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Post } from "@/lib/db";
import { Tile } from "./Tile";
import { UploadModal } from "./UploadModal";
import { getTier, timeAgo, shortWallet, formatTokens, TIER_THRESHOLDS } from "@/lib/utils";

const TOKEN_NAME  = process.env.NEXT_PUBLIC_TOKEN_NAME ?? "TOKEN";
const TOKEN_MINT  = process.env.NEXT_PUBLIC_TOKEN_MINT ?? "";
const MIN_TOKENS  = parseInt(process.env.NEXT_PUBLIC_MIN_TOKENS ?? "1");
const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET ?? "";

export function MemeBoard() {
  const { publicKey, connected } = useWallet();
  const [posts, setPosts]                   = useState<Post[]>([]);
  const [tokens, setTokens]                 = useState<number | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [showUpload, setShowUpload]          = useState(false);
  const [selected, setSelected]             = useState<Post | null>(null);
  const [loading, setLoading]               = useState(true);
  const [postError, setPostError]           = useState("");
  const [tick, setTick]                     = useState(0);
  const [marketCap, setMarketCap]           = useState<string | null>(null);
  const [copied, setCopied]                 = useState(false);

  // Ticker animation
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60);
    return () => clearInterval(t);
  }, []);

  // Fetch posts
  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Fetch market cap from DexScreener
  useEffect(() => {
    if (!TOKEN_MINT || TOKEN_MINT === "YOUR_TOKEN_MINT_ADDRESS_HERE") return;
    fetch(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_MINT}`)
      .then((r) => r.json())
      .then((d) => {
        const pair = d?.pairs?.[0];
        if (pair?.fdv) {
          const fdv = parseFloat(pair.fdv);
          if (fdv >= 1_000_000_000) setMarketCap(`$${(fdv / 1_000_000_000).toFixed(1)}B`);
          else if (fdv >= 1_000_000)  setMarketCap(`$${(fdv / 1_000_000).toFixed(1)}M`);
          else if (fdv >= 1_000)      setMarketCap(`$${(fdv / 1_000).toFixed(1)}K`);
          else setMarketCap(`$${fdv.toFixed(0)}`);
        }
      })
      .catch(() => {});
  }, []);

  // Token balance
  useEffect(() => {
    if (!connected || !publicKey) { setTokens(null); return; }
    setCheckingBalance(true);
    fetch(`/api/balance?wallet=${publicKey.toBase58()}`)
      .then((r) => r.json())
      .then((d) => setTokens(d.tokens ?? 0))
      .catch(() => setTokens(0))
      .finally(() => setCheckingBalance(false));
  }, [connected, publicKey]);

  const isAdmin = ADMIN_WALLET !== "" && publicKey?.toBase58() === ADMIN_WALLET;

  const handlePost = useCallback(
    async (data: { type: "image" | "text"; content: string; name: string }) => {
      if (!publicKey || tokens === null) throw new Error("Wallet not connected");
      if (!isAdmin && tokens < MIN_TOKENS) throw new Error(`Need at least ${MIN_TOKENS} ${TOKEN_NAME} to post`);

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          tokens: isAdmin && tokens === 0 ? 999999999 : tokens,
          type: data.type,
          content: data.content,
          name: data.name || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Post failed");
      setPosts((prev) => [json.post, ...prev]);
      setPostError("");
    },
    [publicKey, tokens, isAdmin]
  );

  const copyMint = () => {
    if (!TOKEN_MINT) return;
    navigator.clipboard.writeText(TOKEN_MINT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const canPost    = connected && tokens !== null && !checkingBalance && (tokens >= MIN_TOKENS || isAdmin);
  const userTier   = tokens ? getTier(tokens) : null;
  const holders    = new Set(posts.map((p) => p.wallet)).size;

  const tickerText    = `◆ BOARD OF MEME ◆ ${TOKEN_NAME} HOLDERS ONLY ◆ BIGGER BAGS = BIGGER MEME ◆ `;
  const offset        = tick % tickerText.length;
  const tickerDisplay = (tickerText + tickerText).slice(offset, offset + 80);

  const shortMint = TOKEN_MINT
    ? `${TOKEN_MINT.slice(0, 6)}...${TOKEN_MINT.slice(-6)}`
    : "";

  return (
    <div style={styles.root}>
      <div style={styles.scanlines} />

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div>
            <div style={styles.logoMain}>BOARD OF MEME</div>
            {isAdmin && <div style={styles.adminBadge}>⚡ ADMIN</div>}
          </div>
          <div style={styles.tickerTrack}>{tickerDisplay}</div>
        </div>

        <div style={styles.headerRight}>
          {/* Stats */}
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <span style={styles.statVal}>{posts.length}</span>
              <span style={styles.statLbl}>POSTS</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.stat}>
              <span style={styles.statVal}>{holders}</span>
              <span style={styles.statLbl}>HOLDERS</span>
            </div>
            {marketCap && (
              <>
                <div style={styles.statDivider} />
                <div style={styles.stat}>
                  <span style={{ ...styles.statVal, color: "#00FF88" }}>{marketCap}</span>
                  <span style={styles.statLbl}>MKTCAP</span>
                </div>
              </>
            )}
          </div>

          {/* My balance badge */}
          {connected && tokens !== null && (
            <div style={styles.balanceBadge}>
              {userTier && <span>{userTier.emoji}</span>}
              <span style={{ color:"#FFE500", fontWeight:800 }}>
                {checkingBalance ? "..." : formatTokens(tokens)}
              </span>
              <span style={{ color:"#666", fontSize:10 }}>{TOKEN_NAME}</span>
            </div>
          )}

          {/* Wallet + post btn + contract address stacked */}
          <div style={styles.walletStack}>
            <div style={styles.walletRow}>
              <WalletMultiButton style={walletBtnStyle} />
              {canPost && (
                <button style={styles.postBtn} onClick={() => setShowUpload(true)}>
                  + POST MEME
                </button>
              )}
            </div>

            {/* Contract address */}
            {TOKEN_MINT && (
              <div style={styles.contractRow} onClick={copyMint} title="Click to copy">
                <span style={styles.contractLabel}>CA:</span>
                <span style={styles.contractAddr}>{shortMint}</span>
                <span style={styles.copyIcon}>{copied ? "✓ COPIED" : "⎘ COPY"}</span>
              </div>
            )}

            {connected && !checkingBalance && tokens !== null && tokens < MIN_TOKENS && !isAdmin && (
              <div style={styles.noTokensWarning}>
                ⚠ Need {formatTokens(MIN_TOKENS)}+ {TOKEN_NAME} to post
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Tier Legend ── */}
      <div style={styles.legend}>
        {TIER_THRESHOLDS.map((t) => (
          <div key={t.label} style={styles.legendItem}>
            <span style={{ fontSize:16 }}>{t.emoji}</span>
            <div>
              <div style={styles.legendLabel}>{t.label}</div>
              <div style={styles.legendSub}>{t.min > 0 ? `${formatTokens(t.min)}+` : "any"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Board ── */}
      <main style={styles.board}>
        {loading ? (
          <div style={styles.centerMsg}>
            <div style={{ fontSize:32 }}>◐</div>
            <div style={{ marginTop:12 }}>LOADING BOARD...</div>
          </div>
        ) : posts.length === 0 ? (
          <div style={styles.centerMsg}>
            <div style={{ fontSize:52 }}>📋</div>
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:3, marginTop:12, color:"#FFE500" }}>
              BOARD IS EMPTY
            </div>
            <div style={{ fontSize:13, opacity:0.5, marginTop:8, maxWidth:240, textAlign:"center" }}>
              Be the first to post. Connect your wallet and drop your meme.
            </div>
          </div>
        ) : (
          posts.map((p) => <Tile key={p.id} post={p} onClick={setSelected} />)
        )}
      </main>

      {/* ── Upload Modal ── */}
      {showUpload && publicKey && tokens !== null && (
        <UploadModal
          wallet={publicKey.toBase58()}
          tokens={tokens}
          onSubmit={handlePost}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div style={styles.overlay} onClick={() => setSelected(null)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
            {selected.type === "image" ? (
              <img
                src={selected.content}
                style={{ maxWidth:"100%", maxHeight:420, borderRadius:6, objectFit:"contain" }}
                alt={selected.name ?? "meme"}
              />
            ) : (
              <div style={styles.detailText}>{selected.content}</div>
            )}
            <div style={styles.detailMeta}>
              <span style={{ fontSize:18, fontWeight:900, color:"#FFE500" }}>
                {selected.name ?? shortWallet(selected.wallet)}
              </span>
              <span style={{ fontSize:13 }}>
                {getTier(selected.tokens).emoji} {formatTokens(selected.tokens)} {TOKEN_NAME}
                <span style={{ opacity:0.5, marginLeft:8 }}>({shortWallet(selected.wallet)})</span>
              </span>
              <span style={{ fontSize:11, color:"#555" }}>{timeAgo(selected.created_at)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const walletBtnStyle: React.CSSProperties = {
  background: "#FFE500", color: "#000",
  fontFamily: "'Courier New', monospace",
  fontWeight: 900, fontSize: 12, letterSpacing: 1, height: 38, borderRadius: 2,
};

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight:"100vh", background:"#080808", fontFamily:"'Courier New',monospace", color:"#f0f0f0", position:"relative" },
  scanlines: { position:"fixed", inset:0, pointerEvents:"none", zIndex:9999, background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px)" },
  header: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderBottom:"2px solid #FFE500", background:"#0d0d0d", gap:16, flexWrap:"wrap", position:"sticky", top:0, zIndex:100 },
  headerLeft: { display:"flex", alignItems:"center", gap:20, flex:1, minWidth:0 },
  logoMain: { fontSize:26, fontWeight:900, letterSpacing:5, color:"#FFE500", lineHeight:1 },
  adminBadge: { fontSize:9, letterSpacing:3, color:"#FF3B00", marginTop:3, fontWeight:900 },
  tickerTrack: { fontSize:10, color:"#444", whiteSpace:"nowrap", overflow:"hidden", flex:1, minWidth:0, letterSpacing:2 },
  headerRight: { display:"flex", alignItems:"center", gap:12, flexShrink:0, flexWrap:"wrap" },
  statsRow: { display:"flex", alignItems:"center", gap:10 },
  stat: { display:"flex", flexDirection:"column", alignItems:"center" },
  statVal: { fontSize:18, fontWeight:900, color:"#FFE500", lineHeight:1 },
  statLbl: { fontSize:8, color:"#555", letterSpacing:2 },
  statDivider: { width:1, height:28, background:"#2a2a2a" },
  balanceBadge: { display:"flex", alignItems:"center", gap:6, background:"#1a1a1a", padding:"6px 10px", fontSize:12, border:"1px solid #2a2a2a" },
  walletStack: { display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 },
  walletRow: { display:"flex", alignItems:"center", gap:8 },
  postBtn: { background:"#FF3B00", color:"#fff", border:"none", padding:"8px 16px", fontFamily:"'Courier New',monospace", fontWeight:900, fontSize:12, cursor:"pointer", letterSpacing:1 },
  contractRow: {
    display:"flex", alignItems:"center", gap:6, cursor:"pointer",
    background:"#0d0d0d", border:"1px solid #2a2a2a", padding:"4px 10px",
    borderRadius:2, transition:"border-color 0.15s",
  },
  contractLabel: { fontSize:9, color:"#555", letterSpacing:2, fontWeight:700 },
  contractAddr: { fontSize:10, color:"#888", letterSpacing:1 },
  copyIcon: { fontSize:9, color:"#FFE500", letterSpacing:1, fontWeight:700 },
  noTokensWarning: { fontSize:11, color:"#FF3B00", fontWeight:700 },
  legend: { display:"flex", gap:16, padding:"8px 20px", background:"#0a0a0a", borderBottom:"1px solid #1a1a1a", flexWrap:"wrap" },
  legendItem: { display:"flex", alignItems:"center", gap:7 },
  legendLabel: { fontSize:10, fontWeight:700, letterSpacing:1 },
  legendSub: { fontSize:9, color:"#444" },
  board: { display:"flex", flexWrap:"wrap", gap:10, padding:20, alignItems:"flex-start", minHeight:"70vh" },
  centerMsg: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:60, margin:"0 auto", color:"#555" },
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.93)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 },
  detailModal: { background:"#111", border:"2px solid #FFE500", borderRadius:4, padding:24, maxWidth:540, width:"100%", position:"relative", display:"flex", flexDirection:"column", gap:14 },
  detailText: { background:"#0d0d0d", padding:24, borderRadius:4, fontSize:22, fontWeight:700, lineHeight:1.4, minHeight:120, display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center", wordBreak:"break-word" },
  detailMeta: { display:"flex", flexDirection:"column", gap:4 },
  closeBtn: { position:"absolute", top:12, right:12, background:"none", border:"1px solid #444", color:"#aaa", width:30, height:30, cursor:"pointer", fontSize:14, fontFamily:"inherit" },
};