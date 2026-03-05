export const TIER_THRESHOLDS = [
  { min: 1_000_000, tier: 10, label: "WHALE",   emoji: "🐋", size: 340 },
  { min: 500_000,   tier: 8,  label: "SHARK",   emoji: "🦈", size: 280 },
  { min: 100_000,   tier: 6,  label: "DOLPHIN", emoji: "🐬", size: 210 },
  { min: 50_000,    tier: 4,  label: "FISH",    emoji: "🐟", size: 160 },
  { min: 10_000,    tier: 3,  label: "SHRIMP",  emoji: "🦐", size: 120 },
  { min: 0,         tier: 2,  label: "PLANKTON",emoji: "🦠", size: 88  },
] as const;

export function getTier(tokens: number) {
  return TIER_THRESHOLDS.find((t) => tokens >= t.min) ?? TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1];
}

export function timeAgo(ts: string | Date) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function shortWallet(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
