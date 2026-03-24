"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useActor } from "@/components/providers/ActorProvider";
import {
  uploadPostMedia,
  searchMentionSuggestions,
  type MentionSuggestion,
} from "@/lib/services/feedService";
import {
  ArrowLeft, Camera, Type, X, Loader2, MapPin, AtSign,
  Settings2, Check, Users, Globe, MessageCircle, ChevronRight, Search,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StoryMode = "pick" | "text" | "media";

type StoryFont = {
  id:      string;
  label:   string;
  family:  string;
  style?:  string;
  weight?: number;
};

type TextLayer = {
  id:       string;
  text:     string;
  x:        number; // % of canvas width
  y:        number; // % of canvas height
  color:    string;
  fontSize: number; // px
  fontId:   string; // key into STORY_FONTS
};

type MentionChip = {
  id:   string;
  name: string;
  slug: string | null;
  kind: "profile" | "business" | "organization";
  x:    number;
  y:    number;
};

type DragRef = {
  kind:   "text" | "mention";
  id:     string;
  startX: number;
  startY: number;
  initX:  number;
  initY:  number;
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

const TEXT_BG_OPTIONS = [
  { id: "gold",    gradient: "linear-gradient(145deg, #120f08 0%, #1e1608 55%, #120f08 100%)", swatch: "#b08d57" },
  { id: "onyx",    gradient: "linear-gradient(160deg, #090909 0%, #141414 100%)",              swatch: "#555"    },
  { id: "ocean",   gradient: "linear-gradient(145deg, #060c18 0%, #0d1828 100%)",              swatch: "#3b6fd8" },
  { id: "crimson", gradient: "linear-gradient(145deg, #120608 0%, #220e16 100%)",              swatch: "#c45a6a" },
  { id: "forest",  gradient: "linear-gradient(145deg, #060e08 0%, #0c1c10 100%)",              swatch: "#4aae6a" },
  { id: "cosmos",  gradient: "linear-gradient(145deg, #09060f 0%, #180d24 100%)",              swatch: "#9b5bd8" },
];

const STORY_FONTS: StoryFont[] = [
  { id: "clean",   label: "Clean",  family: "system-ui, -apple-system, sans-serif"               },
  { id: "serif",   label: "Serif",  family: "Georgia, 'Times New Roman', serif"                   },
  { id: "heavy",   label: "Heavy",  family: "'Arial Black', 'Helvetica Neue', sans-serif", weight: 900 },
  { id: "italic",  label: "Italic", family: "Georgia, 'Times New Roman', serif", style: "italic"  },
  { id: "mono",    label: "Mono",   family: "'Courier New', Courier, monospace"                    },
];

const MEDIA_TOOLS = [
  { id: "text",     Icon: Type,      label: "Aa"  },
  { id: "mention",  Icon: AtSign,    label: "@"   },
  { id: "location", Icon: MapPin,    label: "Loc" },
  { id: "settings", Icon: Settings2, label: "More"},
];

const DEFAULT_FONT_SIZE = 24;
const DRAFT_DEFAULT_SIZE = 26;

function getFontStyle(fontId: string): StoryFont {
  return STORY_FONTS.find(f => f.id === fontId) ?? STORY_FONTS[0];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StoriesNewPage() {
  const router           = useRouter();
  const { currentActor } = useActor();

  // ── Mode
  const [mode, setMode] = useState<StoryMode>("pick");

  // ── Media
  const [storyFile,    setStoryFile]    = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string | null>(null);
  const [storyIsVideo, setStoryIsVideo] = useState(false);
  const [storyFilter,  setStoryFilter]  = useState("normal");

  // ── Text layers (media mode)
  const [textLayers,     setTextLayers]     = useState<TextLayer[]>([]);
  const [activeLayerId,  setActiveLayerId]  = useState<string | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [isTypingText,   setIsTypingText]   = useState(false);
  const [draftText,      setDraftText]      = useState("");
  const [draftColor,     setDraftColor]     = useState("#ffffff");
  const [draftFontSize,  setDraftFontSize]  = useState(DRAFT_DEFAULT_SIZE);
  const [draftFontId,    setDraftFontId]    = useState("clean");

  // ── Text story (text mode)
  const [mainText,       setMainText]       = useState("");
  const [textBgId,       setTextBgId]       = useState("gold");
  const [textFontSize,   setTextFontSize]   = useState(DEFAULT_FONT_SIZE);
  const [textFontId,     setTextFontId]     = useState("clean");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Mentions (shared)
  const [mentionChips,      setMentionChips]      = useState<MentionChip[]>([]);
  const [activeMentionId,   setActiveMentionId]   = useState<string | null>(null);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery,      setMentionQuery]      = useState("");
  const [mentionResults,    setMentionResults]    = useState<MentionSuggestion[]>([]);
  const [mentionLoading,    setMentionLoading]    = useState(false);

  // ── Location (shared)
  const [locationTag,       setLocationTag]       = useState<string | null>(null);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [locationInput,     setLocationInput]     = useState("");

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
  const dragRef         = useRef<DragRef | null>(null);
  const mentionInputRef = useRef<HTMLInputElement>(null);

  // Object URL cleanup
  useEffect(() => { storyPreviewRef.current = storyPreview; }, [storyPreview]);
  useEffect(() => () => {
    if (storyPreviewRef.current) URL.revokeObjectURL(storyPreviewRef.current);
  }, []);

  // Auto-resize textarea in text mode
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [mainText]);

  // Focus mention input; clear on close and restore focus if text mode
  useEffect(() => {
    if (showMentionPicker) {
      setTimeout(() => mentionInputRef.current?.focus(), 80);
    } else {
      setMentionQuery(""); setMentionResults([]);
      if (mode === "text" && textareaRef.current) {
        // Return focus to the story textarea so the user can continue typing continuously
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    }
  }, [showMentionPicker, mode]);

  // Debounced mention search
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!mentionQuery.trim() || mentionQuery.length < 2) { setMentionResults([]); return; }
      setMentionLoading(true);
      try {
        const res = await searchMentionSuggestions(mentionQuery);
        setMentionResults(res);
      } finally {
        setMentionLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  const filterCss = STORY_FILTERS[storyFilter]?.css ?? "";
  const textBg    = TEXT_BG_OPTIONS.find(b => b.id === textBgId) ?? TEXT_BG_OPTIONS[0];
  const textFont  = getFontStyle(textFontId);
  const draftFont = getFontStyle(draftFontId);

  // ── File select → media mode
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { setError("File must be under 100 MB."); return; }
    if (storyPreview) URL.revokeObjectURL(storyPreview);
    setStoryFile(file);
    setStoryPreview(URL.createObjectURL(file));
    setStoryIsVideo(file.type.startsWith("video/"));
    setStoryFilter("normal");
    setTextLayers([]); setMentionChips([]); setLocationTag(null);
    setActiveLayerId(null); setActiveMentionId(null); setEditingLayerId(null);
    setIsTypingText(false); setDraftText("");
    setError("");
    setMode("media");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearMedia = useCallback(() => {
    if (storyPreview) URL.revokeObjectURL(storyPreview);
    setStoryFile(null); setStoryPreview(null); setStoryIsVideo(false);
    setStoryFilter("normal"); setTextLayers([]);
    setMentionChips([]); setLocationTag(null);
    setActiveLayerId(null); setActiveMentionId(null); setEditingLayerId(null);
    setIsTypingText(false); setDraftText("");
    setMode("pick");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [storyPreview]);

  const exitTextMode = () => {
    setMainText(""); setMentionChips([]); setLocationTag(null);
    setTextBgId("gold"); setTextFontSize(DEFAULT_FONT_SIZE); setTextFontId("clean"); setError("");
    setMode("pick");
  };

  // ── Unified drag: text layers + mention chips
  const onElementPointerDown = (
    e: React.PointerEvent,
    kind: "text" | "mention",
    id: string,
    x: number,
    y: number,
  ) => {
    e.stopPropagation();
    if (kind === "text")    setActiveLayerId(id);
    if (kind === "mention") setActiveMentionId(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { kind, id, startX: e.clientX, startY: e.clientY, initX: x, initY: y };
  };

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx   = ((e.clientX - dragRef.current.startX) / rect.width)  * 100;
    const dy   = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    const nx   = Math.max(5, Math.min(80, dragRef.current.initX + dx));
    const ny   = Math.max(5, Math.min(87, dragRef.current.initY + dy));
    if (dragRef.current.kind === "text") {
      setTextLayers(prev => prev.map(l => l.id === dragRef.current!.id ? { ...l, x: nx, y: ny } : l));
    } else {
      setMentionChips(prev => prev.map(m => m.id === dragRef.current!.id ? { ...m, x: nx, y: ny } : m));
    }
  };

  const onCanvasPointerUp = () => { dragRef.current = null; };

  // ── Text layer pointer up: distinguish tap (re-edit) from drag (move)
  const onTextLayerPointerUp = (e: React.PointerEvent, layer: TextLayer) => {
    e.stopPropagation();
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    const moved = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
    if (moved < 8) {
      // Tap → open edit for this layer
      setDraftText(layer.text);
      setDraftColor(layer.color);
      setDraftFontSize(layer.fontSize);
      setDraftFontId(layer.fontId);
      setEditingLayerId(layer.id);
      setIsTypingText(true);
    }
  };

  // ── Confirm text edit / add new layer
  const confirmTextEdit = () => {
    if (!draftText.trim()) {
      setIsTypingText(false);
      setEditingLayerId(null);
      return;
    }
    if (editingLayerId) {
      setTextLayers(prev => prev.map(l =>
        l.id === editingLayerId
          ? { ...l, text: draftText.trim(), color: draftColor, fontSize: draftFontSize, fontId: draftFontId }
          : l
      ));
    } else {
      setTextLayers(prev => [...prev, {
        id:       `t${Date.now()}`,
        text:     draftText.trim(),
        x:        50,
        y:        35 + prev.length * 15,
        color:    draftColor,
        fontSize: draftFontSize,
        fontId:   draftFontId,
      }]);
    }
    setDraftText(""); setIsTypingText(false); setEditingLayerId(null);
  };

  const openNewTextLayer = () => {
    setDraftText(""); setDraftColor("#ffffff");
    setDraftFontSize(DRAFT_DEFAULT_SIZE); setDraftFontId("clean");
    setEditingLayerId(null); setIsTypingText(true);
  };

  // ── Add mention chip
  const addMention = (s: MentionSuggestion) => {
    setMentionChips(prev => [...prev, {
      id:   `m${Date.now()}`,
      name: s.name,
      slug: s.username_or_slug,
      kind: s.type,
      x:    50,
      y:    18 + prev.length * 10,
    }]);
    setShowMentionPicker(false);
  };

  // ── Confirm location
  const confirmLocation = () => {
    if (locationInput.trim()) setLocationTag(locationInput.trim());
    setLocationInput("");
    setShowLocationSheet(false);
  };

  // ── Media mode tool tap
  const handleToolTap = (toolId: string) => {
    if (toolId === "text")     { openNewTextLayer();          return; }
    if (toolId === "mention")  { setShowMentionPicker(true);  return; }
    if (toolId === "location") { setShowLocationSheet(true);  return; }
    if (toolId === "settings") { setShowSettings(true);       return; }
  };

  // ── Author fields
  const authorFields = (): Record<string, unknown> => {
    if (!currentActor) return {};
    if (currentActor.type === "person")       return { author_profile_id:      currentActor.id };
    if (currentActor.type === "business")     return { author_business_id:     currentActor.id };
    if (currentActor.type === "organization") return { author_organization_id: currentActor.id };
    return {};
  };

  // ── Post text story
  async function handlePostTextStory() {
    if (!mainText.trim() || !currentActor) return;
    setIsPosting(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const storyMeta: Record<string, unknown> = {
        url: "", media_type: "story_meta", order_index: 0, background_id: textBgId,
      };
      if (mentionChips.length > 0)
        storyMeta.mentions = mentionChips.map(m => ({ name: m.name, slug: m.slug, kind: m.kind }));
      if (locationTag)
        storyMeta.location = locationTag;
      const { error: dbErr } = await supabase.from("feed_posts").insert({
        submitted_by: user.id, content: mainText.trim(), post_type: "story",
        content_type: "post", status: "published",
        distribute_to_pulse: false, distribute_to_following: false,
        media_items: [storyMeta], ...authorFields(),
      });
      if (dbErr) throw dbErr;
      router.push("/community");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to post story.");
      setIsPosting(false);
    }
  }

  // ── Post media story
  async function handlePostMediaStory() {
    if (!storyFile || !currentActor) return;
    setIsPosting(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const uploaded = await uploadPostMedia([storyFile], user.id);
      const textContent = textLayers.map(l => l.text).join("\n");
      const mediaItems: unknown[] = [...(uploaded as unknown[])];
      if (mentionChips.length > 0 || locationTag) {
        const meta: Record<string, unknown> = { url: "", media_type: "story_meta", order_index: 999 };
        if (mentionChips.length > 0)
          meta.mentions = mentionChips.map(m => ({ name: m.name, slug: m.slug, kind: m.kind }));
        if (locationTag) meta.location = locationTag;
        mediaItems.push(meta);
      }
      const { error: dbErr } = await supabase.from("feed_posts").insert({
        submitted_by: user.id, content: textContent, post_type: "story",
        content_type: "post", status: "published",
        distribute_to_pulse: false, distribute_to_following: false,
        media_items: mediaItems, ...authorFields(),
      });
      if (dbErr) throw dbErr;
      router.push("/community");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to post story.");
      setIsPosting(false);
    }
  }

  // ─── Shared canvas overlays ───────────────────────────────────────────────

  // Translucent tool button (glassy floating style)
  function ToolBtn({
    onClick, active, children, className = "",
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`
          w-10 h-10 rounded-full flex flex-col items-center justify-center gap-[3px]
          backdrop-blur-xl border transition-all
          ${active
            ? "bg-[#b08d57]/25 border-[#b08d57]/45 text-[#b08d57]"
            : "bg-white/[0.13] border-white/[0.20] text-white/75 hover:bg-white/[0.20] hover:border-white/[0.30]"
          }
          ${className}
        `}
      >
        {children}
      </button>
    );
  }

  // Right-side vertical tool rail (shared by both text and media modes)
  function OverlayRail({ includeTextTool }: { includeTextTool?: boolean }) {
    return (
      <div className="absolute top-[72px] right-3.5 z-20 flex flex-col gap-2.5">
        {includeTextTool && (
          <ToolBtn onClick={openNewTextLayer}>
            <Type size={14} strokeWidth={1.8} />
            <span className="text-[7px] leading-none font-medium">Aa</span>
          </ToolBtn>
        )}
        <ToolBtn onClick={() => setShowMentionPicker(true)} active={mentionChips.length > 0}>
          <AtSign size={14} strokeWidth={1.8} />
          <span className="text-[7px] leading-none font-medium">@</span>
        </ToolBtn>
        <ToolBtn onClick={() => setShowLocationSheet(true)} active={!!locationTag}>
          <MapPin size={14} strokeWidth={1.8} />
          <span className="text-[7px] leading-none font-medium">Loc</span>
        </ToolBtn>
        <ToolBtn onClick={() => setShowSettings(true)}>
          <Settings2 size={14} strokeWidth={1.8} />
          <span className="text-[7px] leading-none font-medium">More</span>
        </ToolBtn>
      </div>
    );
  }

  function MentionChips() {
    return (
      <>
        {mentionChips.map((chip) => (
          <div
            key={chip.id}
            className="absolute cursor-move touch-none z-[15]"
            style={{ left: `${chip.x}%`, top: `${chip.y}%`, transform: "translate(-50%, -50%)", touchAction: "none" }}
            onPointerDown={(e) => onElementPointerDown(e, "mention", chip.id, chip.x, chip.y)}
          >
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-sm font-semibold backdrop-blur-xl whitespace-nowrap select-none ${
              activeMentionId === chip.id
                ? "border-[#b08d57]/55 bg-[#b08d57]/20 text-[#b08d57]"
                : "border-white/22 bg-black/45 text-white"
            }`}>
              <AtSign size={11} strokeWidth={2.5} className="shrink-0" />
              <span>{chip.name}</span>
              {activeMentionId === chip.id && (
                <button
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setMentionChips(prev => prev.filter(m => m.id !== chip.id));
                    setActiveMentionId(null);
                  }}
                  className="ml-1 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center"
                  style={{ touchAction: "none" }}
                >
                  <X size={8} strokeWidth={3} className="text-white" />
                </button>
              )}
            </div>
          </div>
        ))}
      </>
    );
  }

  function LocationPill() {
    if (!locationTag) return null;
    return (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[15]">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-white/15 backdrop-blur-xl whitespace-nowrap select-none">
          <MapPin size={11} strokeWidth={2} className="text-[#b08d57] shrink-0" />
          <span className="text-white/80 text-xs font-medium">{locationTag}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setLocationTag(null); }}
            className="ml-0.5 w-4 h-4 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/28 transition"
          >
            <X size={7} strokeWidth={3} className="text-white/70" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Shared sheets ────────────────────────────────────────────────────────

  function MentionPickerSheet() {
    if (!showMentionPicker) return null;
    return (
      <div className="absolute inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/55 backdrop-blur-xl" onClick={() => setShowMentionPicker(false)} />
        <div className="relative bg-[#111] rounded-t-[28px] border-t border-white/[0.08] pb-8 flex flex-col" style={{ maxHeight: "72%" }}>
          <div className="w-8 h-1 rounded-full bg-white/15 mx-auto mt-4 mb-3 shrink-0" />
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.16em] px-5 mb-3 shrink-0">Mention Someone</p>
          <div className="px-4 mb-3 shrink-0">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.09]">
              <Search size={13} strokeWidth={2} className="text-white/30 shrink-0" />
              <input
                ref={mentionInputRef}
                type="text"
                value={mentionQuery}
                onChange={(e) => setMentionQuery(e.target.value)}
                placeholder="Name, Organization or Business"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 px-2">
            {mentionLoading && (
              <div className="flex justify-center py-8"><Loader2 size={16} className="text-[var(--accent)] animate-spin" /></div>
            )}
            {!mentionLoading && mentionQuery.length >= 2 && mentionResults.length === 0 && (
              <p className="text-center text-xs text-white/25 py-8">No results for &quot;{mentionQuery}&quot;</p>
            )}
            {!mentionLoading && mentionQuery.length < 2 && (
              <p className="text-center text-xs text-white/20 py-8">Start typing to search</p>
            )}
            {mentionResults.map((s) => {
              const initials = s.name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
              return (
                <button key={s.id} onClick={() => addMention(s)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition text-left">
                  <div className="w-9 h-9 rounded-full bg-[#b08d57]/15 border border-[#b08d57]/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {s.avatar_url
                      ? <img src={s.avatar_url} alt={s.name} className="w-full h-full object-cover" />
                      : <span className="text-xs font-bold text-[#b08d57]/70">{initials}</span>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{s.name}</p>
                    {s.username_or_slug && <p className="text-xs text-white/30 truncate">@{s.username_or_slug}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function LocationSheet() {
    if (!showLocationSheet) return null;
    return (
      <div className="absolute inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/55 backdrop-blur-xl" onClick={() => setShowLocationSheet(false)} />
        <div className="relative bg-[#111] rounded-t-[28px] border-t border-white/[0.08] px-5 pt-4 pb-10">
          <div className="w-8 h-1 rounded-full bg-white/15 mx-auto mb-4" />
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.16em] mb-4">Add Location</p>
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-4">
            <MapPin size={14} strokeWidth={1.8} className="text-[#b08d57]/60 shrink-0" />
            <input
              type="text" value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmLocation(); } }}
              placeholder="e.g. Tirana, Albania"
              autoFocus
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
            />
            {locationInput && (
              <button onClick={() => setLocationInput("")} className="text-white/30 hover:text-white/60 transition">
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
          <button onClick={confirmLocation} disabled={!locationInput.trim()}
            className="w-full bg-[#b08d57] text-black font-semibold py-3 rounded-full text-sm disabled:opacity-40 transition-opacity">
            Add Location
          </button>
        </div>
      </div>
    );
  }

  function SettingsSheet() {
    if (!showSettings) return null;
    return (
      <div className="absolute inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/55 backdrop-blur-xl" onClick={() => setShowSettings(false)} />
        <div className="relative bg-[#111111] rounded-t-[28px] border-t border-white/[0.08] px-5 pt-4 pb-10">
          <div className="w-8 h-1 rounded-full bg-white/15 mx-auto mb-5" />
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.16em] mb-5">Story Settings</p>
          <div className="mb-5">
            <p className="text-[10px] text-white/22 uppercase tracking-[0.12em] font-semibold mb-2.5">Who can view</p>
            <div className="space-y-2">
              {([
                { value: "everyone",    label: "Everyone",    Icon: Globe,  sub: "Visible to all WAC members" },
                { value: "connections", label: "Connections", Icon: Users,  sub: "Only people you follow"     },
              ] as const).map(({ value, label, Icon, sub }) => (
                <button key={value} onClick={() => setAudience(value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors text-left ${
                    audience === value
                      ? "border-[#b08d57]/22 bg-[#b08d57]/[0.05]"
                      : "border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}>
                  <Icon size={15} strokeWidth={1.6} className={audience === value ? "text-[#b08d57]" : "text-white/30"} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium leading-snug ${audience === value ? "text-[#b08d57]" : "text-white/60"}`}>{label}</p>
                    <p className="text-[10px] text-white/22 leading-snug">{sub}</p>
                  </div>
                  {audience === value && <Check size={13} className="text-[#b08d57] shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <MessageCircle size={15} strokeWidth={1.6} className="text-white/30" />
              <div>
                <p className="text-sm font-medium text-white/60">Allow Replies</p>
                <p className="text-[10px] text-white/22 leading-snug">People can respond to this story</p>
              </div>
            </div>
            <button onClick={() => setAllowReplies(v => !v)}
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 shrink-0 ${allowReplies ? "bg-[#b08d57]" : "bg-white/10"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${allowReplies ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center">

      <input ref={fileInputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" onChange={handleFileSelect} className="hidden" />

      <div className="
        relative flex flex-col
        w-full h-full
        md:w-[390px] md:h-[min(86dvh,693px)]
        md:rounded-[40px] md:border md:border-white/[0.08]
        md:shadow-[0_40px_100px_rgba(0,0,0,0.75)]
        overflow-hidden bg-[#080808]
      ">

        {/* ══════════════════════════════════════════════════════════════════
            PICK mode
        ══════════════════════════════════════════════════════════════════ */}
        {mode === "pick" && (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
              <button onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-full text-white/45 hover:text-white/80 hover:bg-white/[0.06] transition">
                <ArrowLeft size={18} strokeWidth={2} />
              </button>
              <p className="text-sm font-semibold text-white/50 tracking-tight">New Story</p>
              <div className="w-9" />
            </div>

            {currentActor && (
              <div className="px-4 mb-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] w-fit">
                  <div className="w-4 h-4 rounded-full bg-[#b08d57]/20 flex items-center justify-center shrink-0">
                    <span className="text-[7px] font-bold text-[#b08d57]/75">{currentActor.name[0]}</span>
                  </div>
                  <span className="text-[11px] text-white/40 font-medium leading-none">{currentActor.name}</span>
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col justify-center px-5 pb-10 pt-4 gap-3">
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-[28px] border-2 border-dashed border-[#b08d57]/12 bg-[#b08d57]/[0.015] hover:border-[#b08d57]/28 hover:bg-[#b08d57]/[0.035] active:scale-[0.99] flex flex-col items-center justify-center gap-4 py-12 transition-all duration-200">
                <div className="w-16 h-16 rounded-full bg-[#b08d57]/[0.07] flex items-center justify-center ring-1 ring-[#b08d57]/[0.08]">
                  <Camera size={26} strokeWidth={1.2} className="text-[#b08d57]/50" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white/55 mb-1">Add photo or video</p>
                  <p className="text-xs text-white/20">Up to 100 MB · disappears after 24 hrs</p>
                </div>
              </button>

              <div className="flex items-center gap-3 px-2">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] text-white/20 font-medium tracking-wider">or</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <button onClick={() => setMode("text")}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-[22px] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.13] active:scale-[0.99] transition-all duration-150">
                <div className="w-11 h-11 rounded-2xl bg-white/[0.06] flex items-center justify-center shrink-0">
                  <Type size={18} strokeWidth={1.5} className="text-white/50" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-white/70 mb-0.5">Text Story</p>
                  <p className="text-xs text-white/28 leading-snug">Write, mention people, tag a location</p>
                </div>
                <ChevronRight size={15} strokeWidth={2} className="text-white/20 shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TEXT mode — text story composer
        ══════════════════════════════════════════════════════════════════ */}
        {mode === "text" && (
          <>
            {/* Canvas */}
            <div
              ref={canvasRef}
              className="relative flex-1 min-h-0 overflow-hidden select-none"
              style={{ background: textBg.gradient }}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setActiveLayerId(null); setActiveMentionId(null);
                  textareaRef.current?.blur();
                }
              }}
            >
              {/* Vignettes */}
              <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-black/45 to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/35 to-transparent pointer-events-none z-10" />

              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-5 pb-3">
                <button onClick={exitTextMode}
                  className="px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/[0.12] text-white/60 text-sm font-medium hover:text-white/80 transition">
                  Cancel
                </button>
                {currentActor && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/35 border border-white/[0.10] backdrop-blur-xl">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#b08d57]/30 flex items-center justify-center shrink-0">
                      <span className="text-[6px] font-bold text-[#b08d57]/80">{currentActor.name[0]}</span>
                    </div>
                    <span className="text-[11px] text-white/50 font-medium leading-none">{currentActor.name}</span>
                  </div>
                )}
                <button onClick={handlePostTextStory} disabled={!mainText.trim() || isPosting}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#b08d57] text-black text-sm font-bold disabled:opacity-40 hover:bg-[#9a7545] transition">
                  {isPosting && <Loader2 size={13} className="animate-spin text-[var(--accent)]" />}
                  {isPosting ? "Posting…" : "Post"}
                </button>
              </div>

              {/* Right-side overlay tool rail */}
              {OverlayRail({})}

              {/* Centered textarea — click-stop prevents canvas deselect while typing */}
              <div
                className="absolute inset-0 flex items-center justify-center px-8 z-[12]"
                onClick={(e) => e.stopPropagation()}
              >
                <textarea
                  ref={textareaRef}
                  value={mainText}
                  onChange={(e) => setMainText(e.target.value)}
                  placeholder="Start writing…"
                  rows={1}
                  className="w-full bg-transparent text-white text-center focus:outline-none resize-none overflow-hidden placeholder:text-white/20 leading-snug"
                  style={{
                    fontSize:    `${textFontSize}px`,
                    fontFamily:  textFont.family,
                    fontStyle:   textFont.style ?? "normal",
                    fontWeight:  textFont.weight ?? 600,
                    textShadow:  "0 2px 14px rgba(0,0,0,0.65)",
                    caretColor:  textBg.swatch,
                  }}
                />
              </div>

              {/* Mention chips */}
              {MentionChips()}

              {/* Location pill */}
              {LocationPill()}

              {error && (
                <div className="absolute bottom-20 left-4 right-4 z-20 text-center">
                  <p className="text-xs text-red-400/90 bg-black/50 rounded-xl px-3 py-2">{error}</p>
                </div>
              )}
            </div>

            {/* Bottom toolbar — font family + bg + size slider */}
            <div className="shrink-0 bg-black/60 backdrop-blur-xl border-t border-white/[0.06]">

              {/* Row 1: Font family picker */}
              <div className="flex items-center gap-2 px-4 pt-3 pb-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {STORY_FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTextFontId(f.id)}
                    className={`shrink-0 px-3 py-1 rounded-full text-sm transition-all border ${
                      textFontId === f.id
                        ? "bg-white/15 text-white border-white/30"
                        : "text-white/35 border-transparent hover:text-white/60 hover:border-white/10"
                    }`}
                    style={{
                      fontFamily: f.family,
                      fontStyle:  f.style ?? "normal",
                      fontWeight: f.weight ?? 500,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Row 2: bg swatches + font size slider */}
              <div className="flex items-center gap-3 px-4 pt-1 pb-4">
                {/* Background swatches */}
                <div className="flex items-center gap-2 shrink-0">
                  {TEXT_BG_OPTIONS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setTextBgId(bg.id)}
                      className={`rounded-full transition-all duration-150 shrink-0 ${
                        textBgId === bg.id
                          ? "ring-2 ring-white/60 ring-offset-1 ring-offset-black/40 scale-[1.25]"
                          : "opacity-50 hover:opacity-80"
                      }`}
                      style={{ width: 20, height: 20, backgroundColor: bg.swatch }}
                      aria-label={bg.id}
                    />
                  ))}
                </div>

                {/* Font size slider */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-white/35 shrink-0"
                    style={{ fontFamily: textFont.family }}>A</span>
                  <input
                    type="range" min={13} max={54} step={1}
                    value={textFontSize}
                    onChange={(e) => setTextFontSize(Number(e.target.value))}
                    className="flex-1 h-1 rounded-full cursor-pointer appearance-none"
                    style={{ accentColor: textBg.swatch }}
                  />
                  <span className="text-[16px] text-white/35 shrink-0"
                    style={{ fontFamily: textFont.family }}>A</span>
                </div>
              </div>
            </div>

            {MentionPickerSheet()}
            {LocationSheet()}
            {SettingsSheet()}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MEDIA mode — media story editor
        ══════════════════════════════════════════════════════════════════ */}
        {mode === "media" && storyPreview && (
          <>
            <div
              ref={canvasRef}
              className="relative flex-1 min-h-0 bg-black overflow-hidden select-none"
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onClick={() => { if (!isTypingText) { setActiveLayerId(null); setActiveMentionId(null); } }}
            >
              {/* Media */}
              {storyIsVideo
                ? <video key={storyPreview} src={storyPreview} autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ filter: filterCss }} />
                : <img src={storyPreview} alt="Story" draggable={false} className="w-full h-full object-cover" style={{ filter: filterCss }} />
              }

              {/* Vignettes */}
              <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/65 to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-10" />

              {/* Back button — top-left */}
              <button
                onClick={(e) => { e.stopPropagation(); clearMedia(); }}
                className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl bg-white/[0.13] border border-white/[0.20] text-white/75 hover:bg-white/[0.20] transition"
              >
                <X size={14} strokeWidth={2} />
              </button>

              {/* Right-side overlay tool rail (includes text tool) */}
              {OverlayRail({ includeTextTool: true })}

              {/* Text layers — draggable + tap-to-edit */}
              {textLayers.map((layer) => {
                const font = getFontStyle(layer.fontId);
                return (
                  <div
                    key={layer.id}
                    className="absolute cursor-move touch-none z-[15]"
                    style={{
                      left:        `${layer.x}%`,
                      top:         `${layer.y}%`,
                      transform:   "translate(-50%, -50%)",
                      color:       layer.color,
                      fontSize:    `${layer.fontSize}px`,
                      fontFamily:  font.family,
                      fontStyle:   font.style ?? "normal",
                      fontWeight:  font.weight ?? 600,
                      textShadow:  "0 1px 10px rgba(0,0,0,0.9)",
                      touchAction: "none",
                      outline:     activeLayerId === layer.id ? "1.5px dashed rgba(255,255,255,0.45)" : "none",
                      outlineOffset: "5px",
                      borderRadius: 2, padding: "2px 5px",
                      whiteSpace: "nowrap", userSelect: "none",
                    }}
                    onPointerDown={(e) => onElementPointerDown(e, "text", layer.id, layer.x, layer.y)}
                    onPointerUp={(e) => onTextLayerPointerUp(e, layer)}
                  >
                    {layer.text}
                    {activeLayerId === layer.id && (
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setTextLayers(prev => prev.filter(l => l.id !== layer.id));
                          setActiveLayerId(null);
                        }}
                        className="absolute -top-5 -right-5 w-6 h-6 bg-black/80 rounded-full flex items-center justify-center border border-[var(--accent)]/20 z-10"
                        style={{ touchAction: "none" }}
                      >
                        <X size={10} className="text-white" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Mention chips */}
              {MentionChips()}

              {/* Location pill */}
              {LocationPill()}

              {/* ── Text input overlay (new or re-edit) ─────────────────── */}
              {isTypingText && (
                <div
                  className="absolute inset-0 z-30 bg-black/35 backdrop-blur-[2px] flex flex-col"
                  onClick={(e) => { if (e.target === e.currentTarget) confirmTextEdit(); }}
                >
                  {/* Cancel / Done */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                    <button
                      onClick={() => { setIsTypingText(false); setDraftText(""); setEditingLayerId(null); }}
                      className="text-white/55 text-sm font-medium hover:text-white transition px-1"
                    >
                      Cancel
                    </button>
                    <span className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">
                      {editingLayerId ? "Edit Text" : "Add Text"}
                    </span>
                    <button onClick={confirmTextEdit}
                      className="text-white text-sm font-semibold hover:text-[#b08d57] transition px-1">
                      Done
                    </button>
                  </div>

                  {/* Text input */}
                  <div className="flex-1 flex items-center justify-center px-8">
                    <input
                      type="text"
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmTextEdit(); } }}
                      placeholder="Type something…"
                      autoFocus
                      className="w-full text-center bg-transparent focus:outline-none placeholder:text-white/30 placeholder:font-normal"
                      style={{
                        fontSize:   `${draftFontSize}px`,
                        fontFamily: draftFont.family,
                        fontStyle:  draftFont.style ?? "normal",
                        fontWeight: draftFont.weight ?? 600,
                        color:      draftColor,
                        textShadow: "0 2px 12px rgba(0,0,0,0.9)",
                        caretColor: draftColor,
                      }}
                    />
                  </div>

                  {/* Controls area */}
                  <div className="px-5 pb-8 shrink-0 space-y-4">

                    {/* Font family row */}
                    <div className="flex items-center justify-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                      {STORY_FONTS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setDraftFontId(f.id)}
                          className={`shrink-0 px-3 py-1 rounded-full text-sm transition-all border ${
                            draftFontId === f.id
                              ? "bg-white/20 text-white border-white/35"
                              : "text-white/35 border-white/10 hover:text-white/60"
                          }`}
                          style={{ fontFamily: f.family, fontStyle: f.style ?? "normal", fontWeight: f.weight ?? 500 }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

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
                            width: 26, height: 26, backgroundColor: c.value,
                            border: c.value === "#ffffff" ? "1.5px solid rgba(255,255,255,0.35)" : undefined,
                          }}
                          aria-label={c.label}
                        />
                      ))}
                    </div>

                    {/* Font size slider */}
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-white/35 shrink-0"
                        style={{ fontFamily: draftFont.family }}>A</span>
                      <input
                        type="range" min={13} max={54} step={1}
                        value={draftFontSize}
                        onChange={(e) => setDraftFontSize(Number(e.target.value))}
                        className="flex-1 h-1 rounded-full cursor-pointer appearance-none"
                        style={{ accentColor: draftColor }}
                      />
                      <span className="text-[17px] text-white/35 shrink-0"
                        style={{ fontFamily: draftFont.family }}>A</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom: filter strip + indicators + CTA */}
            <div className="shrink-0 bg-[#080808]">
              <div className="flex gap-3 px-4 pt-3 pb-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {Object.entries(STORY_FILTERS).map(([key, f]) => (
                  <button key={key} onClick={() => setStoryFilter(key)} className="flex flex-col items-center gap-1.5 shrink-0">
                    <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all duration-150 ${
                      storyFilter === key ? "border-[#b08d57] scale-105" : "border-white/[0.09] hover:border-white/22"
                    }`}>
                      {storyIsVideo
                        ? <div className="w-full h-full bg-white/[0.06] flex items-center justify-center">
                            <span className="text-[7px] text-white/35 font-semibold uppercase tracking-wider">{f.label}</span>
                          </div>
                        : <img src={storyPreview} alt={f.label} draggable={false} className="w-full h-full object-cover pointer-events-none" style={{ filter: f.css }} />
                      }
                    </div>
                    <span className={`text-[9px] font-medium ${storyFilter === key ? "text-[#b08d57]" : "text-white/22"}`}>{f.label}</span>
                  </button>
                ))}
              </div>

              {/* Mention/location indicator strip */}
              {(mentionChips.length > 0 || locationTag) && (
                <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {mentionChips.map(m => (
                    <div key={m.id} className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#b08d57]/10 border border-[#b08d57]/20 text-[#b08d57] text-[11px] font-medium shrink-0 whitespace-nowrap">
                      <AtSign size={9} strokeWidth={2.5} />{m.name}
                    </div>
                  ))}
                  {locationTag && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.06] border border-white/[0.10] text-white/50 text-[11px] font-medium shrink-0 whitespace-nowrap">
                      <MapPin size={9} strokeWidth={2} />{locationTag}
                    </div>
                  )}
                </div>
              )}

              {error && <p className="px-4 py-1.5 text-xs text-red-400">{error}</p>}

              <div className="px-4 pb-8 pt-2">
                <button onClick={handlePostMediaStory} disabled={isPosting}
                  className="w-full bg-[#b08d57] text-black hover:bg-[#9a7545] py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-colors tracking-[0.04em]">
                  {isPosting && <Loader2 size={14} className="animate-spin text-[var(--accent)]" />}
                  {isPosting ? "Posting…" : "Post Story"}
                </button>
              </div>
            </div>

            {MentionPickerSheet()}
            {LocationSheet()}
            {SettingsSheet()}
          </>
        )}

      </div>
    </div>
  );
}
