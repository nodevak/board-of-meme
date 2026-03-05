"use client";

import { useRef, useState } from "react";
import { getTier, formatTokens } from "@/lib/utils";

type Props = {
  wallet: string;
  tokens: number;
  onSubmit: (data: { type: "image" | "text"; content: string; name: string }) => Promise<void>;
  onClose: () => void;
};

export function UploadModal({ wallet, tokens, onSubmit, onClose }: Props) {
  const [tab, setTab]       = useState<"image" | "text">("image");
  const [text, setText]     = useState("");
  const [name, setName]     = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const tier = getTier(tokens);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      setError("Image must be under 2MB");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Only images allowed"); return; }
    if (file.size > 2_000_000) { setError("Image must be under 2MB"); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const canSubmit = tab === "image" ? !!preview : text.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await onSubmit({
        type: tab,
        content: tab === "image" ? preview! : text.trim(),
        name: name.trim(),
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={overlay}
      onClick={onClose}
    >
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:20, fontWeight:900, letterSpacing:4, color:"#FFE500" }}>
            POST YOUR MEME
          </span>
          <button style={closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Tier badge */}
        <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap",
          background:"#1a1a1a", padding:"8px 12px", fontSize:12 }}>
          <span>Your bag:</span>
          <span style={{ color:"#FFE500", fontWeight:800 }}>{formatTokens(tokens)} tokens</span>
          <span style={{ background:"#FF3B00", color:"#fff", padding:"2px 8px",
            fontWeight:900, fontSize:11, letterSpacing:2 }}>
            {tier.emoji} {tier.label} SIZE
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8 }}>
          {(["image","text"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              ...tabBtn,
              ...(tab === t ? tabActive : {}),
            }}>
              {t === "image" ? "🖼 IMAGE / GIF" : "✏️ TEXT / ALPHA"}
            </button>
          ))}
        </div>

        {/* Content area */}
        {tab === "image" ? (
          <div
            style={{ ...dropZone, borderColor: preview ? "#FFE500" : "#333" }}
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {preview ? (
              <img src={preview} style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", borderRadius:4 }} alt="preview" />
            ) : (
              <div style={{ textAlign:"center", color:"#555", lineHeight:2 }}>
                <div style={{ fontSize:36 }}>📤</div>
                <div style={{ fontWeight:700 }}>Click or drag & drop</div>
                <div style={{ fontSize:11, opacity:0.6 }}>PNG · JPG · GIF · WEBP · max 2MB</div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} />
          </div>
        ) : (
          <textarea
            style={textarea}
            placeholder="Drop your alpha, shill your bags, speak truth... 🔥&#10;(max 280 chars)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={280}
          />
        )}

        {/* Display name */}
        <input
          style={input}
          placeholder="Display name (optional, default: your wallet)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
        />

        {error && (
          <div style={{ color:"#FF3B00", fontSize:12, fontWeight:700 }}>⚠ {error}</div>
        )}

        <button
          style={{ ...submitBtn, opacity: !canSubmit || loading ? 0.45 : 1, cursor: canSubmit && !loading ? "pointer" : "not-allowed" }}
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
        >
          {loading ? "⏳ POSTING..." : "🚀 PLACE ON BOARD"}
        </button>
      </div>
    </div>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────
const overlay: React.CSSProperties = {
  position:"fixed", inset:0, background:"rgba(0,0,0,0.93)",
  display:"flex", alignItems:"center", justifyContent:"center",
  zIndex:1000, padding:16,
};
const modal: React.CSSProperties = {
  background:"#111", border:"2px solid #FFE500", borderRadius:4,
  padding:24, width:"100%", maxWidth:460, maxHeight:"92vh", overflowY:"auto",
  display:"flex", flexDirection:"column", gap:14,
  fontFamily:"'Courier New',monospace", color:"#f0f0f0",
};
const closeBtn: React.CSSProperties = {
  background:"none", border:"1px solid #444", color:"#aaa",
  width:32, height:32, cursor:"pointer", fontSize:14, fontFamily:"inherit",
};
const tabBtn: React.CSSProperties = {
  flex:1, padding:"10px 0", background:"#1a1a1a", border:"1px solid #333",
  color:"#aaa", cursor:"pointer", fontFamily:"'Courier New',monospace",
  fontWeight:700, fontSize:12, letterSpacing:1,
};
const tabActive: React.CSSProperties = {
  background:"#FFE500", color:"#000", border:"1px solid #FFE500",
};
const dropZone: React.CSSProperties = {
  height:200, border:"2px dashed #333", display:"flex",
  alignItems:"center", justifyContent:"center", cursor:"pointer",
  overflow:"hidden", borderRadius:4, background:"#0d0d0d",
};
const textarea: React.CSSProperties = {
  width:"100%", height:130, background:"#0d0d0d", border:"1px solid #333",
  color:"#f0f0f0", padding:12, fontFamily:"'Courier New',monospace",
  fontSize:14, resize:"none", boxSizing:"border-box", outline:"none",
};
const input: React.CSSProperties = {
  width:"100%", background:"#0d0d0d", border:"1px solid #333",
  color:"#f0f0f0", padding:"10px 12px", fontFamily:"'Courier New',monospace",
  fontSize:13, outline:"none", boxSizing:"border-box",
};
const submitBtn: React.CSSProperties = {
  background:"#FF3B00", color:"#fff", border:"none", padding:"14px 0",
  fontFamily:"'Courier New',monospace", fontWeight:900, fontSize:15,
  letterSpacing:2, width:"100%",
};
