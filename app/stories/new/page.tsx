"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useActor } from "@/components/providers/ActorProvider";
import { uploadPostMedia } from "@/lib/services/feedService";
import {
  ArrowLeft, Camera, Type, X, Loader2, Plus, MapPin, AtSign,
  Smile, Music, Pencil, Settings2, Check, Users, Globe, MessageCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TextLayer = {
  id:    string;
  text:  string;
  x:     number; // % of canvas width
  y:     number; // % of canvas height
  color: string;
  size:  "sm" | "md" | "lg";
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORY_FILTERS: Record<string, { label: string; css: string }> = {
  normal: { label: "Normal", css: "" },
  warm:   { label: "Warm",   css: "sepia(0.35) saturate(1.4) brightness(1.05)" },
  cool:   { label: "Cool",   css: "hue-rotate(20deg) saturate(0.85) brightness(0.97)" },
  bw:     { label: "B&W",    css: "grayscale(1) contrast(1.15)" },
  vivid:  { label: "Vivid",  css: "saturate(1.6) contrast(1.1) brightness(1.05)" },
  fade:   { label: "Fade",   css: "brightness(1.12) saturate(0.65) contrast(0.88)" },
};

const TEXT_COLORS = [
  { value: "#ffffff", label: "White"  },
  { value: "#000000", label: "Black"  },
  { value: "#b08d57", label: "Gold"   },
  { value: "#f87171", label: "Red"    },
  { value: "#facc15", label: "Yellow" },
  { value: "#60a5fa", label: "Blue"   },
  { value: "#34d399", label: "Green"  },
];

const TEXT_FONT_SIZES: Record<TextLayer["size"], string> = {
  sm: "16px",
  md: "26px",
  lg: "38px",
};

// Tool rail — shown on the right side of the canvas
const TOOL_ITEMS: { id: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; label: string; enabled: boolean }[] = [
  { id: "text",    Icon: Type,      label: "Aa",     enabled: true  },
  { id: "sticker", Icon: Smile,     label: "Sticker",enabled: false },
  { id: "music",   Icon: Music,     label: "Music",  enabled: false },
  { id: "draw",    Icon: Pencil,    label: "Draw",   enabled: false },
  { id: "more",    Icon: Settings2, label: "More",   enabled: true  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StoriesNewPage() {
  const router       = useRouter();
  const { currentActor } = useActor();

  // ── Media
  const [storyFile,    setStoryFile]    = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string | null>(null);
  const [storyIsVideo, setStoryIsVideo] = useState(false);
  const [storyFilter,  setStoryFilter]  = useState("normal");

  // ── Text layers
  const [textLayers,    setTextLayers]    = useState<TextLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [isTypingText,  setIsTypingText]  = useState(false);
  const [draftText,     setDraftText]     = useState("");
  const [draftColor,    setDraftColor]    = useState("#ffffff");
  const [draftSize,     setDraftSize]     = useState<TextLayer["size"]>("md");

  // ── Story settings
  const [showSettings, setShowSettings] = useState(false);
  const [audience,     setAudience]     = useState<"everyone" | "connections">("everyone");
  const [allowReplies, setAllowReplies] = useState(true);

  // ── Post state
  const [isPosting, setIsPosting] = useState(false);
  const [error,     setError]     = useState("");

  // ── Refs
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const canvasRef       = useRef<HTMLDivElement>(null);
  const storyPreviewRef = useRef<string | null>(null);
  const dragRef         = useRef<{
    layerId: string; startX: number; startY: number; initX: number; initY: number;
  } | null>(null);

  // Cleanup object URL on unmount
  useEffect(() => { storyPreviewRef.current = storyPreview; }, [storyPreview]);
  useEffect(() => {
    return () => { if (storyPreviewRef.current) URL.revokeObjectURL(storyPreviewRef.current); };
  }, []);

  const filterCss = STORY_FILTERS[storyFilter]?.css ?? "";

  // ── File select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { setError("File must be under 100 MB."); return; }
    if (storyPreview) URL.revokeObjectURL(storyPreview);
    setStoryFile(file);
    setStoryPreview(URL.createObjectURL(file));
    setStoryIsVideo(file.type.startsWith("video/"));
    setStoryFilter("normal");
    setTextLayers([]); setActiveLayerId(null); setIsTypingText(false); setDraftText("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearMedia = useCallback(() => {
    if (storyPreview) URL.revokeObjectURL(storyPreview);
    setStoryFile(null); setStoryPreview(null); setStoryIsVideo(false);
    setStoryFilter("normal"); setTextLayers([]); setActiveLayerId(null);
    setIsTypingText(false); setDraftText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [storyPreview]);

  // ── Text layer drag
  const onLayerPointerDown = (e: React.PointerEvent, layer: TextLayer) => {
    e.stopPropagation();
    setActiveLayerId(layer.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      layerId: layer.id, startX: e.clientX, startY: e.clientY,
      initX: layer.x, initY: layer.y,
    };
  };

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.startX) / rect.width)  * 100;
    const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    setTextLayers(prev => prev.map(l =>
      l.id === dragRef.current!.layerId
        ? { ...l,
            x: Math.max(2,  Math.min(88, dragRef.current!.initX + dx)),
            y: Math.max(2,  Math.min(92, dragRef.current!.initY + dy)),
          }
        : l,
    ));
  };

  const onCanvasPointerUp = () => { dragRef.current = null; };

  const addTextLayer = () => {
    if (!draftText.trim()) { setIsTypingText(false); return; }
    setTextLayers(prev => [...prev, {
      id:    `t${Date.now()}`,
      text:  draftText.trim(),
      x:     50,
      y:     40 + prev.length * 12,
      color: draftColor,
      size:  draftSize,
    }]);
    setDraftText(""); setIsTypingText(false);
  };

  const handleToolTap = (toolId: string) => {
    if (toolId === "text") { setIsTypingText(true); return; }
    if (toolId === "more") { setShowSettings(true);  return; }
    // other tools: coming soon, no action
  };

  // ── Post story
  async function handlePost() {
    if (!storyFile || !currentActor) return;
    setIsPosting(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const uploaded = await uploadPostMedia([storyFile], user.id);
      const textContent = textLayers.map(l => l.text).join("\n");
      const payload: Record<string, unknown> = {
        submitted_by: user.id, content: textContent, post_type: "story",
        content_type: "post", status: "published",
        distribute_to_pulse: false, distribute_to_following: false,
        media_items: uploaded,
      };
      if (currentActor.type === "person")            payload.author_profile_id      = currentActor.id;
      else if (currentActor.type === "business")     payload.author_business_id     = currentActor.id;
      else if (currentActor.type === "organization") payload.author_organization_id = currentActor.id;
      const { error: dbError } = await supabase.from("feed_posts").insert(payload);
      if (dbError) throw dbError;
      router.push("/community");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to post story.");
      setIsPosting(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    // Outer shell — full-screen dark backdrop on all sizes
    <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/*
        Phone stage
        — Full-screen on mobile
        — Centered vertical phone-proportioned card on desktop (390×693 ~ 9:16)
        This keeps Story Mode visually uniform across all devices.
      */}
      <div className="
        relative flex flex-col
        w-full h-full
        md:w-[390px] md:h-[min(86dvh,693px)]
        md:rounded-[40px] md:border md:border-white/[0.08]
        md:shadow-[0_40px_100px_rgba(0,0,0,0.75)]
        overflow-hidden bg-[#080808]
      ">

        {/* ══════════════════════════════════════════════════════════════════
            NO MEDIA  —  Story picker / entry flow
        ══════════════════════════════════════════════════════════════════ */}
        {!storyPreview && (
          <div className="flex-1 flex flex-col overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-full text-white/45 hover:text-white/80 hover:bg-white/[0.06] transition"
                aria-label="Go back"
              >
                <ArrowLeft size={18} strokeWidth={2} />
              </button>
              <p className="text-sm font-semibold text-white/50 tracking-tight">New Story</p>
              <div className="w-9" />
            </div>

            {/* Identity indicator */}
            {currentActor && (
              <div className="px-4 mb-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] w-fit">
                  <div className="w-4 h-4 rounded-full bg-[#b08d57]/20 flex items-center justify-center shrink-0">
                    <span className="text-[7px] font-bold text-[#b08d57]/75">{currentActor.name[0]}</span>
                  </div>
                  <span className="text-[11px] text-white/40 font-medium leading-none">{currentActor.name}</span>
                </div>
              </div>
            )}

            {/* Upload zone */}
            <div className="flex-1 flex flex-col items-center justify-center px-5 pb-10 pt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="
                  w-full rounded-[28px]
                  border-2 border-dashed border-[#b08d57]/12 bg-[#b08d57]/[0.015]
                  hover:border-[#b08d57]/28 hover:bg-[#b08d57]/[0.035]
                  active:scale-[0.99] flex flex-col items-center justify-center
                  gap-5 py-16 transition-all duration-200
                "
              >
                <div className="w-20 h-20 rounded-full bg-[#b08d57]/[0.07] flex items-center justify-center ring-1 ring-[#b08d57]/08">
                  <Camera size={32} strokeWidth={1.2} className="text-[#b08d57]/50" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white/50 mb-1.5">Add a photo or video</p>
                  <p className="text-xs text-white/20 leading-relaxed">
                    Stories disappear after 24 hours<br />Supports up to 100 MB
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#b08d57]/10 text-[#b08d57]/45 text-xs font-medium tracking-[0.03em]">
                  <Plus size={10} strokeWidth={2.5} />
                  Choose from library
                </div>
              </button>

              {/* Coming-soon story types */}
              <div className="mt-6 w-full grid grid-cols-3 gap-2.5">
                {[
                  { label: "Text Story", Icon: Type,  desc: "Words only"  },
                  { label: "Mention",    Icon: AtSign, desc: "Tag someone" },
                  { label: "Location",   Icon: MapPin, desc: "Add a place" },
                ].map(({ label, Icon, desc }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border border-white/[0.05] bg-white/[0.01] opacity-35 cursor-not-allowed select-none"
                  >
                    <Icon size={15} strokeWidth={1.6} className="text-white/45" />
                    <span className="text-[9px] font-semibold text-white/38 tracking-widest uppercase">{label}</span>
                    <span className="text-[8px] text-white/18">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            HAS MEDIA  —  Story editor
        ══════════════════════════════════════════════════════════════════ */}
        {storyPreview && (
          <>
            {/* ── Canvas ─────────────────────────────────────────────────── */}
            <div
              ref={canvasRef}
              className="relative flex-1 min-h-0 bg-black overflow-hidden select-none"
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onClick={() => { if (!isTypingText) setActiveLayerId(null); }}
            >
              {/* Media */}
              {storyIsVideo
                ? <video src={storyPreview} autoPlay muted loop playsInline
                    className="w-full h-full object-cover"
                    style={{ filter: filterCss }} />
                : <img src={storyPreview} alt="Story" draggable={false}
                    className="w-full h-full object-cover"
                    style={{ filter: filterCss }} />
              }

              {/* Top vignette gradient */}
              <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/65 to-transparent pointer-events-none z-10" />
              {/* Bottom vignette gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-10" />

              {/* Back / remove button (top-left) */}
              <button
                onClick={(e) => { e.stopPropagation(); clearMedia(); }}
                className="absolute top-4 left-4 z-20 w-10 h-10 bg-black/35 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/[0.12] hover:bg-black/55 transition"
                aria-label="Remove media"
              >
                <X size={14} className="text-white" strokeWidth={2} />
              </button>

              {/* Tool rail (top-right vertical column) */}
              <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                {TOOL_ITEMS.map(({ id, Icon, label, enabled }) => (
                  <button
                    key={id}
                    onClick={(e) => { e.stopPropagation(); if (enabled) handleToolTap(id); }}
                    className={`
                      w-10 h-10 rounded-full flex flex-col items-center justify-center gap-[3px]
                      backdrop-blur-sm border transition-all
                      ${enabled
                        ? "bg-black/35 border-white/[0.12] hover:bg-black/55 hover:border-white/20 cursor-pointer"
                        : "bg-black/18 border-white/[0.06] opacity-35 cursor-not-allowed"
                      }
                    `}
                    aria-label={label}
                  >
                    <Icon size={14} className="text-white" strokeWidth={1.8} />
                    <span className="text-[7px] text-white/55 leading-none font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* Text layers */}
              {textLayers.map((layer) => (
                <div
                  key={layer.id}
                  className="absolute cursor-move touch-none z-[15]"
                  style={{
                    left:      `${layer.x}%`,
                    top:       `${layer.y}%`,
                    transform: "translate(-50%, -50%)",
                    color:     layer.color,
                    fontSize:  TEXT_FONT_SIZES[layer.size],
                    fontWeight: layer.size === "lg" ? 900 : layer.size === "md" ? 700 : 500,
                    textShadow: "0 1px 10px rgba(0,0,0,0.9)",
                    touchAction: "none",
                    outline:    activeLayerId === layer.id ? "1.5px dashed rgba(255,255,255,0.45)" : "none",
                    outlineOffset: "5px",
                    borderRadius: 2,
                    padding: "2px 5px",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                  onPointerDown={(e) => onLayerPointerDown(e, layer)}
                >
                  {layer.text}
                  {activeLayerId === layer.id && (
                    <button
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setTextLayers(prev => prev.filter(l => l.id !== layer.id));
                        setActiveLayerId(null);
                      }}
                      className="absolute -top-5 -right-5 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center border border-white/20 z-10"
                      style={{ touchAction: "none" }}
                    >
                      <X size={10} className="text-white" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              ))}

              {/* ── Text input overlay ─────────────────────────────────── */}
              {isTypingText && (
                <div
                  className="absolute inset-0 z-30 bg-black/30 backdrop-blur-[1.5px] flex flex-col"
                  onClick={(e) => { if (e.target === e.currentTarget) addTextLayer(); }}
                >
                  {/* Top: Cancel / Done */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                    <button
                      onClick={() => { setIsTypingText(false); setDraftText(""); }}
                      className="text-white/55 text-sm font-medium hover:text-white transition px-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addTextLayer}
                      className="text-white text-sm font-semibold hover:text-[#b08d57] transition px-1"
                    >
                      Done
                    </button>
                  </div>

                  {/* Center: text input */}
                  <div className="flex-1 flex items-center justify-center px-8">
                    <input
                      type="text"
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTextLayer(); } }}
                      placeholder="Type something…"
                      autoFocus
                      className="w-full text-center bg-transparent focus:outline-none font-bold placeholder:text-white/30 placeholder:font-normal"
                      style={{
                        fontSize:   TEXT_FONT_SIZES[draftSize],
                        color:      draftColor,
                        textShadow: "0 2px 12px rgba(0,0,0,0.9)",
                        caretColor: draftColor,
                      }}
                    />
                  </div>

                  {/* Bottom: color + size controls */}
                  <div className="px-5 pb-10 shrink-0 space-y-4">
                    {/* Color swatches */}
                    <div className="flex items-center justify-center gap-3">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => setDraftColor(c.value)}
                          className={`rounded-full transition-all duration-150 ${
                            draftColor === c.value
                              ? "scale-[1.3] ring-2 ring-white/65 ring-offset-2 ring-offset-transparent"
                              : "opacity-50 hover:opacity-90"
                          }`}
                          style={{
                            width:  26, height: 26,
                            backgroundColor: c.value,
                            border: c.value === "#ffffff" ? "1.5px solid rgba(255,255,255,0.35)" : undefined,
                          }}
                          aria-label={c.label}
                        />
                      ))}
                    </div>
                    {/* Size buttons */}
                    <div className="flex items-center justify-center gap-3">
                      {(["sm", "md", "lg"] as TextLayer["size"][]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setDraftSize(s)}
                          className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                            draftSize === s
                              ? "bg-white text-black scale-105"
                              : "text-white/38 border border-white/18 hover:border-white/40 hover:text-white/65"
                          }`}
                        >
                          {s === "sm" ? "S" : s === "md" ? "M" : "L"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* end canvas */}

            {/* ── Bottom area: filters + post ─────────────────────────── */}
            <div className="shrink-0 bg-[#080808]">

              {/* Filter strip */}
              <div
                className="flex gap-3 px-4 pt-3 pb-2.5 overflow-x-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {Object.entries(STORY_FILTERS).map(([key, f]) => (
                  <button
                    key={key}
                    onClick={() => setStoryFilter(key)}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                  >
                    <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all duration-150 ${
                      storyFilter === key
                        ? "border-[#b08d57] scale-105"
                        : "border-white/[0.09] hover:border-white/22"
                    }`}>
                      {storyIsVideo
                        ? <div className="w-full h-full bg-white/[0.06] flex items-center justify-center">
                            <span className="text-[7px] text-white/35 font-semibold uppercase tracking-wider">{f.label}</span>
                          </div>
                        : <img src={storyPreview} alt={f.label} draggable={false}
                            className="w-full h-full object-cover pointer-events-none"
                            style={{ filter: f.css }} />
                      }
                    </div>
                    <span className={`text-[9px] font-medium ${storyFilter === key ? "text-[#b08d57]" : "text-white/22"}`}>
                      {f.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Error */}
              {error && (
                <p className="px-4 py-1.5 text-xs text-red-400">{error}</p>
              )}

              {/* Post Story CTA */}
              <div className="px-4 pb-8 pt-2">
                <button
                  onClick={handlePost}
                  disabled={isPosting}
                  className="w-full bg-[#b08d57] text-black hover:bg-[#9a7545] py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-colors tracking-[0.04em]"
                >
                  {isPosting && <Loader2 size={14} className="animate-spin" />}
                  {isPosting ? "Posting…" : "Post Story"}
                </button>
              </div>
            </div>

            {/* ── Story Settings sheet ────────────────────────────────── */}
            {showSettings && (
              <div className="absolute inset-0 z-50 flex flex-col justify-end">
                {/* Scrim */}
                <div
                  className="absolute inset-0 bg-black/55 backdrop-blur-sm"
                  onClick={() => setShowSettings(false)}
                />
                {/* Sheet */}
                <div className="relative bg-[#111111] rounded-t-[28px] border-t border-white/[0.08] px-5 pt-4 pb-10">
                  {/* Drag handle */}
                  <div className="w-8 h-1 rounded-full bg-white/15 mx-auto mb-5" />
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.16em] mb-5">
                    Story Settings
                  </p>

                  {/* Who can view */}
                  <div className="mb-5">
                    <p className="text-[10px] text-white/22 uppercase tracking-[0.12em] font-semibold mb-2.5">
                      Who can view
                    </p>
                    <div className="space-y-2">
                      {([
                        { value: "everyone",    label: "Everyone",    Icon: Globe,  sub: "Visible to all WAC members" },
                        { value: "connections", label: "Connections", Icon: Users,  sub: "Only people you follow" },
                      ] as const).map(({ value, label, Icon, sub }) => (
                        <button
                          key={value}
                          onClick={() => setAudience(value)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors text-left ${
                            audience === value
                              ? "border-[#b08d57]/22 bg-[#b08d57]/[0.05]"
                              : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]"
                          }`}
                        >
                          <Icon
                            size={15} strokeWidth={1.6}
                            className={audience === value ? "text-[#b08d57]" : "text-white/30"}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-snug ${audience === value ? "text-[#b08d57]" : "text-white/60"}`}>
                              {label}
                            </p>
                            <p className="text-[10px] text-white/22 leading-snug">{sub}</p>
                          </div>
                          {audience === value && (
                            <Check size={13} className="text-[#b08d57] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Allow replies toggle */}
                  <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <MessageCircle size={15} strokeWidth={1.6} className="text-white/30" />
                      <div>
                        <p className="text-sm font-medium text-white/60">Allow Replies</p>
                        <p className="text-[10px] text-white/22 leading-snug">People can respond to this story</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAllowReplies((v) => !v)}
                      className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${
                        allowReplies ? "bg-[#b08d57]" : "bg-white/10"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        allowReplies ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
