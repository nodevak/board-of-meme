"use client";

import { useState } from "react";
import { Post } from "@/lib/db";
import { getTier, timeAgo, shortWallet, formatTokens } from "@/lib/utils";

export function Tile({
  post,
  onClick,
}: {
  post: Post;
  onClick: (p: Post) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const tier = getTier(post.tokens);
  const size = tier.size;
  const rotation = ((post.id * 17 + 3) % 7 - 3) * 0.5;

  return (
    <div
      onClick={() => onClick(post)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 4,
        overflow: "hidden",
        border: hovered ? "2px solid #FFE500" : "2px solid #1e1e1e",
        cursor: "pointer",
        transform: hovered
          ? "scale(1.06)"
          : `rotate(${rotation}deg)`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        boxShadow: hovered
          ? "0 0 28px rgba(255,229,0,0.5), 0 8px 30px rgba(0,0,0,0.8)"
          : "0 4px 16px rgba(0,0,0,0.6)",
        zIndex: hovered ? 20 : 1,
      }}
    >
      {/* Content */}
      {post.type === "image" ? (
        <img
          src={post.content}
          alt={post.name ?? "meme"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 12,
            background: `hsl(${(post.id * 47) % 360}, 15%, 10%)`,
            color: "#f0f0f0",
            fontFamily: "'Courier New', monospace",
            fontWeight: 700,
            fontSize: Math.max(10, Math.min(20, size / 8)),
            textAlign: "center",
            lineHeight: 1.35,
            wordBreak: "break-word",
            boxSizing: "border-box",
          }}
        >
          {post.content}
        </div>
      )}

      {/* Hover overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.82)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: 8,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.18s ease",
          gap: 2,
        }}
      >
        <span style={{ fontFamily: "'Courier New',monospace", fontWeight: 800, fontSize: 11, color: "#FFE500" }}>
          {post.name ?? shortWallet(post.wallet)}
        </span>
        <span style={{ fontFamily: "'Courier New',monospace", fontSize: 10, color: "#aaa" }}>
          {tier.emoji} {formatTokens(post.tokens)} tokens
        </span>
        <span style={{ fontFamily: "'Courier New',monospace", fontSize: 9, color: "#555" }}>
          {timeAgo(post.created_at)}
        </span>
      </div>

      {/* Tier badge */}
      {tier.tier >= 6 && (
        <div
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            fontSize: 14,
            background: "rgba(0,0,0,0.7)",
            borderRadius: 99,
            padding: "2px 5px",
            lineHeight: 1,
          }}
        >
          {tier.emoji}
        </div>
      )}
    </div>
  );
}
