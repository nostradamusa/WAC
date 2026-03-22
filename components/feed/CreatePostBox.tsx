"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useActor } from "@/components/providers/ActorProvider";
import { uploadPostMedia } from "@/lib/services/feedService";
import {
  X, Plus, Loader2, Image as ImageIcon, FileText, CalendarDays, Camera, Type,
} from "lucide-react";
import MyStoryViewer, { MyStory } from "./MyStoryViewer";

// ─── Types ────────────────────────────────────────────────────────────────────

type ComposeMode = "post" | "story";
type PostType    = "update" | "media" | "event";
type MediaMode   = "idle" | "photo" | "video";

type TextLayer = {
  id: string;
  text: string;
  x: number; // percentage 0–100 of canvas width
  y: number; // percentage 0–100 of canvas height
  color: string;
  size: "sm" | "md" | "lg";
};

// ─── Story editor constants ────────────────────────────────────────────────────

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
  sm: "14px",
  md: "20px",
  lg: "30px",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PHOTOS   = 10;
const MAX_FILE_MB  = 50;
const MAX_TEXTAREA = 160;

// ─── Mock story data — replace with real DB query when stories table exists ──

const MOCK_STORIES = [
  { id: "s1", name: "Ardit Hoxha"  },
  { id: "s2", name: "Elira Koci"   },
  { id: "s3", name: "Bleron Deva"  },
  { id: "s4", name: "Vjosa Molla"  },
  { id: "s5", name: "Gent Berisha" },
];

// Mock stories for the current user — replace with real DB data when stories table is live
const MY_MOCK_STORIES: MyStory[] = [
  {
    id: "my-s1",
    bgGradient: "linear-gradient(145deg, #1a1207 0%, #100d06 60%, #1a1712 100%)",
    content: "Great conversations at the WAC summit today 🇦🇱",
    timeAgo: "2h",
    viewedBy: [
      { name: "Ardit Hoxha",  avatarUrl: null },
      { name: "Elira Koci",   avatarUrl: null },
      { name: "Bleron Deva",  avatarUrl: null },
      { name: "Vjosa Molla",  avatarUrl: null },
      { name: "Gent Berisha", avatarUrl: null },
    ],
  },
  {
    id: "my-s2",
    bgGradient: "linear-gradient(160deg, #0a1218 0%, #060e14 50%, #0a0d14 100%)",
    content: "Connecting the diaspora, one conversation at a time.",
    timeAgo: "5h",
    viewedBy: [
      { name: "Ardit Hoxha", avatarUrl: null },
      { name: "Elira Koci",  avatarUrl: null },
    ],
  },
];

// ─── Story circle sub-component ───────────────────────────────────────────────
// Uses border+padding (not ring/box-shadow) so it renders inside the element's
// layout box and is never clipped by ancestor overflow:hidden / overflow:auto.

function StoryCircle({
  name,
  avatarUrl,
  unseen,
  size = 62,
}: {
  name: string;
  avatarUrl?: string | null;
  unseen: boolean;
  size?: number;
}) {
  const borderCls = unseen
    ? "border-[2.5px] border-[#b08d57] p-[2.5px]"
    : "border-[1.5px] border-white/[0.15] p-[3px]";
  const bgCls = unseen ? "bg-[#b08d57]/[0.07]" : "bg-white/[0.04]";

  return (
    <div className={`rounded-full shrink-0 ${borderCls}`} style={{ width: size, height: size }}>
      <div className={`w-full h-full rounded-full overflow-hidden ${bgCls} flex items-center justify-center`}>
        {avatarUrl
          ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          : <span
              className={`font-bold select-none ${unseen ? "text-[#b08d57]/70" : "text-white/28"}`}
              style={{ fontSize: Math.round(size * 0.32) }}
            >
              {name.charAt(0).toUpperCase()}
            </span>
        }
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreatePostBox({ onPostCreated }: { onPostCreated?: () => void }) {
  const router = useRouter();
  const { currentActor, isLoading } = useActor();

  // ── Sheet / mode state
  const [isSheetOpen,       setIsSheetOpen]       = useState(false);
  const [composeMode,       setComposeMode]       = useState<ComposeMode>("post");
  const [postType,          setPostType]          = useState<PostType>("update");
  const [showMyStoryViewer, setShowMyStoryViewer] = useState(false);

  // ── Story seen state (persisted to localStorage)
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("wac_seen_stories");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });

  // ── Keyboard height (visualViewport)
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // ── Post form state
  const [content,       setContent]       = useState("");
  const [mediaMode,     setMediaMode]     = useState<MediaMode>("idle");
  const [photoFiles,    setPhotoFiles]    = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoFile,     setVideoFile]     = useState<File | null>(null);
  const [videoPreview,  setVideoPreview]  = useState<string | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [error,         setError]         = useState("");

  // ── Story editor state
  const [storyFile,      setStoryFile]      = useState<File | null>(null);
  const [storyPreview,   setStoryPreview]   = useState<string | null>(null);
  const [storyIsVideo,   setStoryIsVideo]   = useState(false);
  const [storyFilter,    setStoryFilter]    = useState("normal");
  const [textLayers,     setTextLayers]     = useState<TextLayer[]>([]);
  const [activeLayerId,  setActiveLayerId]  = useState<string | null>(null);
  const [isTypingText,   setIsTypingText]   = useState(false);
  const [draftText,      setDraftText]      = useState("");
  const [draftColor,     setDraftColor]     = useState("#ffffff");
  const [draftSize,      setDraftSize]      = useState<TextLayer["size"]>("md");
  const [isPostingStory, setIsPostingStory] = useState(false);

  // ── Refs
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const canvasRef     = useRef<HTMLDivElement>(null);
  const dragRef       = useRef<{
    layerId: string; startX: number; startY: number; initX: number; initY: number;
  } | null>(null);

  // URL cleanup refs
  const photoPreviewsRef = useRef<string[]>([]);
  const videoPreviewRef  = useRef<string | null>(null);
  useEffect(() => { photoPreviewsRef.current = photoPreviews; }, [photoPreviews]);
  useEffect(() => { videoPreviewRef.current  = videoPreview;  }, [videoPreview]);
  useEffect(() => {
    return () => {
      photoPreviewsRef.current.forEach(url => URL.revokeObjectURL(url));
      if (videoPreviewRef.current) URL.revokeObjectURL(videoPreviewRef.current);
    };
  }, []);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, MAX_TEXTAREA);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA ? "auto" : "hidden";
  }, [content]);

  // Keyboard avoidance
  useEffect(() => {
    const vp = (window as any).visualViewport as (EventTarget & { height: number }) | undefined;
    if (!vp) return;
    const update = () => setKeyboardHeight(Math.max(0, window.innerHeight - (vp as any).height));
    vp.addEventListener("resize", update);
    vp.addEventListener("scroll", update);
    return () => { vp.removeEventListener("resize", update); vp.removeEventListener("scroll", update); };
  }, []);

  // Listen for open-compose-sheet event from navbar
  useEffect(() => {
    const handler = () => { setComposeMode("post"); setPostType("update"); setIsSheetOpen(true); };
    window.addEventListener("open-compose-sheet", handler);
    return () => window.removeEventListener("open-compose-sheet", handler);
  }, []);

  // ── Post media handlers ───────────────────────────────────────────────────

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const first = files[0];
    if (first.type.startsWith("image/")) {
      for (const f of files) {
        if (f.size > MAX_FILE_MB * 1024 * 1024) { setError(`Each photo must be under ${MAX_FILE_MB} MB.`); return; }
      }
      const combined = [...photoFiles, ...files].slice(0, MAX_PHOTOS);
      const added    = combined.slice(photoFiles.length);
      setPhotoFiles(combined);
      setPhotoPreviews(prev => [...prev, ...added.map(f => URL.createObjectURL(f))].slice(0, MAX_PHOTOS));
      setMediaMode("photo");
    } else if (first.type.startsWith("video/")) {
      if (first.size > MAX_FILE_MB * 1024 * 1024) { setError(`Video must be under ${MAX_FILE_MB} MB.`); return; }
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      setVideoFile(first);
      setVideoPreview(URL.createObjectURL(first));
      setMediaMode("video");
    }
    setError("");
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const removePhoto = (i: number) => {
    URL.revokeObjectURL(photoPreviews[i]);
    const nf = photoFiles.filter((_, j) => j !== i);
    const np = photoPreviews.filter((_, j) => j !== i);
    setPhotoFiles(nf); setPhotoPreviews(np);
    if (!nf.length) setMediaMode("idle");
  };

  const clearAllMedia = useCallback(() => {
    photoPreviews.forEach(url => URL.revokeObjectURL(url));
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setPhotoFiles([]); setPhotoPreviews([]); setVideoFile(null); setVideoPreview(null); setMediaMode("idle");
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  }, [photoPreviews, videoPreview]);

  // ── Story media handler ───────────────────────────────────────────────────

  const handleStoryMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) { setError("File must be under 100 MB."); return; }
    if (storyPreview) URL.revokeObjectURL(storyPreview);
    setStoryFile(file);
    setStoryPreview(URL.createObjectURL(file));
    setStoryIsVideo(file.type.startsWith("video/"));
    setStoryFilter("normal");
    setTextLayers([]);
    setActiveLayerId(null);
    setIsTypingText(false);
    setDraftText("");
    setError("");
    if (storyInputRef.current) storyInputRef.current.value = "";
  };

  const clearStory = useCallback(() => {
    if (storyPreview) URL.revokeObjectURL(storyPreview);
    setStoryFile(null); setStoryPreview(null); setStoryIsVideo(false);
    setStoryFilter("normal"); setTextLayers([]); setActiveLayerId(null);
    setIsTypingText(false); setDraftText("");
    if (storyInputRef.current) storyInputRef.current.value = "";
  }, [storyPreview]);

  // ── Text layer drag (pointer events — works on both touch and mouse) ──────

  const onLayerPointerDown = (e: React.PointerEvent, layer: TextLayer) => {
    e.stopPropagation();
    setActiveLayerId(layer.id);
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    dragRef.current = { layerId: layer.id, startX: e.clientX, startY: e.clientY, initX: layer.x, initY: layer.y };
  };

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.startX) / rect.width)  * 100;
    const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    setTextLayers(prev => prev.map(l =>
      l.id === dragRef.current!.layerId
        ? { ...l, x: Math.max(2, Math.min(88, dragRef.current!.initX + dx)), y: Math.max(2, Math.min(92, dragRef.current!.initY + dy)) }
        : l,
    ));
  };

  const onCanvasPointerUp = () => { dragRef.current = null; };

  // ── Sheet / form lifecycle ────────────────────────────────────────────────

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    setContent(""); clearAllMedia(); setPostType("update"); setComposeMode("post"); setError("");
    clearStory();
  }, [clearAllMedia, clearStory]);

  const handlePostType = (type: PostType) => {
    if (type === "event") {
      // Navigate immediately — do NOT closeSheet() first.
      // Calling closeSheet() removes the overlay before Next.js finishes loading
      // the new route, causing the feed to flash visible for hundreds of ms.
      // Leaving the sheet open means the overlay covers the transition cleanly;
      // CreatePostBox is unmounted by the route change, which discards state naturally.
      router.push("/events/create");
      return;
    }
    setPostType(type);
    if (type === "media" && mediaMode === "idle") setTimeout(() => mediaInputRef.current?.click(), 60);
  };

  const markSeen = (id: string) => {
    setSeenIds(prev => {
      const next = new Set(prev).add(id);
      try { localStorage.setItem("wac_seen_stories", JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  // ── Post submit ───────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && mediaMode === "idle") return;
    setIsSubmitting(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload: Record<string, unknown> = {
        submitted_by: user.id, content: content.trim(), post_type: "general",
        content_type: "post", status: "published",
        distribute_to_pulse: true, distribute_to_following: true,
      };
      if (currentActor?.type === "person")        payload.author_profile_id = currentActor.id;
      else if (currentActor?.type === "business") payload.author_business_id = currentActor.id;
      else if (currentActor?.type === "organization") payload.author_organization_id = currentActor.id;
      if (mediaMode === "photo" && photoFiles.length > 0) {
        const up = await uploadPostMedia(photoFiles, user.id);
        payload.media_items = up;
        if (up.length === 1) payload.image_url = up[0].url;
      } else if (mediaMode === "video" && videoFile) {
        const up = await uploadPostMedia([videoFile], user.id);
        payload.media_items = up;
      }
      const { error: e2 } = await supabase.from("feed_posts").insert(payload);
      if (e2) throw e2;
      closeSheet(); onPostCreated?.();
    } catch (err: any) {
      setError(err.message || "Failed to post. Please try again.");
    } finally { setIsSubmitting(false); }
  }

  // ── Story post ────────────────────────────────────────────────────────────

  async function handlePostStory() {
    if (!storyFile) return;
    setIsPostingStory(true); setError("");
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
      if (currentActor?.type === "person")        payload.author_profile_id = currentActor.id;
      else if (currentActor?.type === "business") payload.author_business_id = currentActor.id;
      else if (currentActor?.type === "organization") payload.author_organization_id = currentActor.id;
      const { error: e2 } = await supabase.from("feed_posts").insert(payload);
      if (e2) throw e2;
      closeSheet();
    } catch (err: any) {
      setError(err.message || "Failed to post story.");
    } finally { setIsPostingStory(false); }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const addTextLayer = () => {
    if (!draftText.trim()) { setIsTypingText(false); return; }
    setTextLayers(prev => [...prev, {
      id: `t${Date.now()}`, text: draftText.trim(),
      x: 50, y: 40 + prev.length * 12,
      color: draftColor, size: draftSize,
    }]);
    setDraftText(""); setIsTypingText(false);
  };

  // ── Loading / unauthenticated ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="pt-5 pb-3">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-[62px] h-[62px] rounded-full bg-white/[0.04] animate-pulse" />
              <div className="w-9 h-2 rounded bg-white/[0.03] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentActor) {
    return (
      <div className="wac-card p-4 text-center text-sm text-white/40 mt-5 mb-2">
        Sign in to share with the network.
      </div>
    );
  }

  // ── Derived ──────────────────────────────────────────────────────────────

  const canSubmit  = (!!content.trim() || mediaMode !== "idle") && !isSubmitting;
  const canAddMore = mediaMode === "photo" && photoFiles.length < MAX_PHOTOS;
  const firstName  = currentActor.name.split(" ")[0];

  const sortedStories = [
    ...MOCK_STORIES.filter(s => !seenIds.has(s.id)),
    ...MOCK_STORIES.filter(s => seenIds.has(s.id)),
  ];

  const POST_TYPES: { type: PostType; label: string; icon: React.ReactNode }[] = [
    { type: "update", label: "Update", icon: <FileText     size={18} strokeWidth={1.6} /> },
    { type: "media",  label: "Media",  icon: <ImageIcon    size={18} strokeWidth={1.6} /> },
    { type: "event",  label: "Event",  icon: <CalendarDays size={18} strokeWidth={1.6} /> },
  ];

  const filterCss = STORY_FILTERS[storyFilter]?.css ?? "";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Post media input */}
      <input id="post-media-input" name="post-media-input" ref={mediaInputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime"
        multiple onChange={handleMediaSelect} className="hidden" />

      {/* Story media input — separate so it doesn't interfere with post media */}
      <input id="story-media-input" name="story-media-input" ref={storyInputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime"
        onChange={handleStoryMediaSelect} className="hidden" />

      {/* ── Stories row ─────────────────────────────────────────────────────── */}
      <div className="pt-5 pb-1">
        <div
          className="flex gap-4 overflow-x-auto pt-1 pb-3 px-0.5"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {/* Your story — avatar opens viewer, + badge opens creator */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowMyStoryViewer(true)}
                aria-label="View your story"
                className="block active:scale-95 transition-transform duration-100"
              >
                <StoryCircle name={currentActor.name} avatarUrl={currentActor.avatar_url} unseen size={62} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); router.push("/stories/new"); }}
                aria-label="Add to story"
                className="absolute bottom-0 right-0 w-[20px] h-[20px] rounded-full bg-[#b08d57] border-2 border-[#151311] flex items-center justify-center hover:bg-[#9a7545] transition-colors z-10"
              >
                <Plus size={9} strokeWidth={3.2} className="text-black" />
              </button>
            </div>
            <span className="text-[10.5px] font-medium text-white/45 leading-none whitespace-nowrap">Your story</span>
          </div>

          {/* Other stories */}
          {sortedStories.map((story) => {
            const isSeen = seenIds.has(story.id);
            return (
              <button key={story.id} onClick={() => markSeen(story.id)}
                className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-transform duration-100"
                aria-label={`${story.name}'s story`}
              >
                <StoryCircle name={story.name} avatarUrl={null} unseen={!isSeen} size={62} />
                <span className={`text-[10.5px] font-medium leading-none whitespace-nowrap ${isSeen ? "text-white/22" : "text-white/50"}`}>
                  {story.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="border-b border-white/[0.06]" />
      </div>

      {/* ── My story viewer ──────────────────────────────────────────────────── */}
      {showMyStoryViewer && (
        <MyStoryViewer
          authorName={currentActor.name}
          authorAvatar={currentActor.avatar_url ?? null}
          stories={MY_MOCK_STORIES}
          onClose={() => setShowMyStoryViewer(false)}
        />
      )}

      {/* ── Compose sheet ─────────────────────────────────────────────────────── */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeSheet} />

          <div
            className="absolute left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center md:pointer-events-none"
            style={{ bottom: keyboardHeight, transition: "bottom 0.15s ease-out" }}
          >
            <div
              className="w-full md:max-w-lg md:pointer-events-auto bg-[#0f0f0f] rounded-t-2xl md:rounded-2xl border-t md:border border-white/[0.09] shadow-2xl overflow-hidden flex flex-col"
              style={{ minHeight: "72dvh", maxHeight: `calc(93dvh - ${keyboardHeight}px)` }}
            >
              {/* Drag handle */}
              <div className="md:hidden flex justify-center pt-3 pb-0 shrink-0">
                <div className="w-9 h-1 rounded-full bg-white/15" />
              </div>

              {/* ── Header ────────────────────────────────────────────────── */}
              <div className="px-5 pt-4 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-[#b08d57]/[0.08] border border-[#b08d57]/20 flex items-center justify-center font-bold text-[#b08d57] text-sm">
                      {currentActor.avatar_url
                        ? <img src={currentActor.avatar_url} alt={currentActor.name} className="w-full h-full object-cover" />
                        : currentActor.name.charAt(0).toUpperCase()
                      }
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-white leading-none">{currentActor.name}</p>
                      <p className="text-[10px] text-white/35 mt-0.5">
                        {composeMode === "story"
                          ? storyPreview ? "Editing your story" : "Adding a story"
                          : `Posting as ${currentActor.type === "person" ? "yourself" : currentActor.type}`
                        }
                      </p>
                    </div>
                  </div>
                  <button onClick={closeSheet}
                    className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.09] transition">
                    <X size={15} strokeWidth={2} />
                  </button>
                </div>

                {/* Story / Post toggle */}
                <div className="inline-flex p-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full mb-4">
                  {(["post", "story"] as ComposeMode[]).map((mode) => (
                    <button key={mode} onClick={() => { setComposeMode(mode); if (mode === "post") clearStory(); }}
                      className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                        composeMode === mode ? "bg-[#b08d57] text-black shadow-sm" : "text-white/45 hover:text-white/70"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Post type picker (post mode only) ─────────────────────── */}
              {composeMode === "post" && (
                <div className="grid grid-cols-3 gap-0 border-y border-white/[0.07] shrink-0">
                  {POST_TYPES.map(({ type, label, icon }) => (
                    <button key={type} onClick={() => handlePostType(type)}
                      className={`flex flex-col items-center gap-1.5 py-3.5 transition-all ${
                        postType === type
                          ? "text-[#b08d57] bg-[#b08d57]/[0.07] border-b-2 border-[#b08d57]/60"
                          : "text-white/38 hover:text-white/65 hover:bg-white/[0.03] border-b-2 border-transparent"
                      }`}
                    >
                      {icon}
                      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Scrollable body ───────────────────────────────────────── */}
              <div className="overflow-y-auto flex-1">

                {/* ── POST MODE ─────────────────────────────────────────────── */}
                {composeMode === "post" && (
                  <form onSubmit={handleSubmit} className="px-5 pb-6 pt-3">
                    <textarea id="post-content-textarea" name="post-content-textarea" ref={textareaRef} value={content} onChange={e => setContent(e.target.value)}
                      placeholder={postType === "media" && mediaMode === "idle" ? "Add a caption…" : `What's on your mind, ${firstName}?`}
                      rows={4} autoFocus disabled={isSubmitting}
                      className="w-full bg-transparent border-b border-white/[0.07] px-0 py-3 text-sm text-white focus:outline-none resize-none placeholder:text-white/22 leading-relaxed"
                      style={{ minHeight: 110 }}
                    />

                    {mediaMode === "photo" && photoPreviews.length > 0 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                        {photoPreviews.map((url, i) => (
                          <div key={i} className="relative shrink-0 w-20 h-20">
                            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover rounded-xl border border-white/[0.10]" />
                            <button type="button" onClick={() => removePhoto(i)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-black border border-white/15 text-white rounded-full flex items-center justify-center z-10">
                              <X size={11} strokeWidth={2.5} />
                            </button>
                          </div>
                        ))}
                        {canAddMore && (
                          <button type="button" onClick={() => mediaInputRef.current?.click()}
                            className="shrink-0 w-20 h-20 rounded-xl border border-dashed border-white/[0.14] flex flex-col items-center justify-center gap-1 text-white/28 hover:border-[#b08d57]/30 hover:text-white/50 transition">
                            <Plus size={16} strokeWidth={2} />
                            <span className="text-[9px] font-medium">{MAX_PHOTOS - photoFiles.length} left</span>
                          </button>
                        )}
                      </div>
                    )}

                    {mediaMode === "video" && videoPreview && (
                      <div className="mt-3 relative rounded-xl overflow-hidden border border-white/[0.10] bg-black">
                        <button type="button" onClick={clearAllMedia}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-black/90 border border-white/10 text-white rounded-full flex items-center justify-center z-10 transition">
                          <X size={13} strokeWidth={2} />
                        </button>
                        <video src={videoPreview} controls className="w-full max-h-56 object-contain" />
                      </div>
                    )}

                    {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                      <button type="button" onClick={() => mediaInputRef.current?.click()} title="Add photo or video"
                        className={`p-2.5 rounded-xl transition-all ${mediaMode !== "idle" ? "text-[#b08d57] bg-[#b08d57]/[0.08]" : "text-white/30 hover:text-white/55 hover:bg-white/[0.05]"}`}>
                        <ImageIcon size={17} strokeWidth={1.7} />
                      </button>
                      <button type="submit" disabled={!canSubmit}
                        className="flex items-center gap-2 bg-[#b08d57] text-black hover:bg-[#9a7545] py-2 px-6 rounded-full text-sm font-bold transition disabled:opacity-35 disabled:cursor-not-allowed">
                        {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                        {isSubmitting ? "Posting…" : "Post"}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── STORY MODE ────────────────────────────────────────────── */}
                {composeMode === "story" && (
                  <div className="flex flex-col">

                    {/* No media selected yet */}
                    {!storyPreview && (
                      <div className="px-5 py-6">
                        <button
                          onClick={() => storyInputRef.current?.click()}
                          className="w-full rounded-2xl border border-dashed border-[#b08d57]/25 bg-[#b08d57]/[0.03]
                            hover:border-[#b08d57]/40 hover:bg-[#b08d57]/[0.06] active:scale-[0.99]
                            flex flex-col items-center justify-center gap-4 py-14 transition-all duration-200"
                        >
                          <div className="w-14 h-14 rounded-full bg-[#b08d57]/[0.10] flex items-center justify-center">
                            <Camera size={24} strokeWidth={1.5} className="text-[#b08d57]/70" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-white/65">Tap to add a photo or video</p>
                            <p className="text-xs text-white/30 mt-1">Stories disappear after 24 hours</p>
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Story editor — shown once media is selected */}
                    {storyPreview && (
                      <div className="flex flex-col">

                        {/* ── Story canvas ──────────────────────────────────── */}
                        <div
                          ref={canvasRef}
                          className="relative w-full bg-black overflow-hidden select-none"
                          style={{ aspectRatio: "4/5", maxHeight: "52vh" }}
                          onPointerMove={onCanvasPointerMove}
                          onPointerUp={onCanvasPointerUp}
                          onPointerCancel={onCanvasPointerUp}
                          onClick={() => setActiveLayerId(null)}
                        >
                          {storyIsVideo
                            ? <video src={storyPreview} autoPlay muted loop playsInline
                                className="w-full h-full object-cover"
                                style={{ filter: filterCss }} />
                            : <img src={storyPreview} alt="Story" draggable={false}
                                className="w-full h-full object-cover"
                                style={{ filter: filterCss }} />
                          }

                          {/* Text layers */}
                          {textLayers.map((layer) => (
                            <div
                              key={layer.id}
                              className="absolute cursor-move touch-none"
                              style={{
                                left: `${layer.x}%`,
                                top: `${layer.y}%`,
                                transform: "translate(-50%, -50%)",
                                color: layer.color,
                                fontSize: TEXT_FONT_SIZES[layer.size],
                                fontWeight: layer.size === "lg" ? 900 : layer.size === "md" ? 700 : 500,
                                textShadow: "0 1px 6px rgba(0,0,0,0.8)",
                                touchAction: "none",
                                outline: activeLayerId === layer.id ? "1.5px dashed rgba(255,255,255,0.5)" : "none",
                                outlineOffset: "4px",
                                borderRadius: 2,
                                padding: "2px 4px",
                                whiteSpace: "nowrap",
                                userSelect: "none",
                              }}
                              onPointerDown={(e) => onLayerPointerDown(e, layer)}
                            >
                              {layer.text}
                              {/* Delete badge — shows when layer is active */}
                              {activeLayerId === layer.id && (
                                <button
                                  onPointerDown={(e) => {
                                    e.stopPropagation();
                                    setTextLayers(prev => prev.filter(l => l.id !== layer.id));
                                    setActiveLayerId(null);
                                  }}
                                  className="absolute -top-4 -right-4 w-6 h-6 bg-black/75 rounded-full flex items-center justify-center border border-white/20 z-10"
                                  style={{ touchAction: "none" }}
                                >
                                  <X size={10} className="text-white" strokeWidth={2.5} />
                                </button>
                              )}
                            </div>
                          ))}

                          {/* Clear / back button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); clearStory(); }}
                            className="absolute top-2.5 left-2.5 w-8 h-8 bg-black/55 hover:bg-black/75 rounded-full flex items-center justify-center transition backdrop-blur-sm border border-white/[0.12]"
                            aria-label="Remove media"
                          >
                            <X size={13} className="text-white" strokeWidth={2} />
                          </button>
                        </div>

                        {/* ── Filter strip ──────────────────────────────────── */}
                        <div
                          className="flex gap-2.5 px-4 pt-3 pb-2 overflow-x-auto shrink-0"
                          style={{ scrollbarWidth: "none" }}
                        >
                          {Object.entries(STORY_FILTERS).map(([key, f]) => (
                            <button key={key} onClick={() => setStoryFilter(key)}
                              className="flex flex-col items-center gap-1 shrink-0">
                              <div className={`w-11 h-11 rounded-lg overflow-hidden border-2 transition-colors ${
                                storyFilter === key ? "border-[#b08d57]" : "border-transparent"
                              }`}>
                                {storyIsVideo
                                  ? <div className="w-full h-full bg-white/[0.08] flex items-center justify-center">
                                      <span className="text-[8px] text-white/40 font-medium uppercase tracking-wider">{f.label}</span>
                                    </div>
                                  : <img src={storyPreview} alt={f.label} draggable={false}
                                      className="w-full h-full object-cover pointer-events-none"
                                      style={{ filter: f.css }} />
                                }
                              </div>
                              <span className={`text-[9px] font-medium leading-none ${storyFilter === key ? "text-[#b08d57]" : "text-white/35"}`}>
                                {f.label}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* ── Text tool ─────────────────────────────────────── */}
                        <div className="px-4 pb-3 shrink-0">
                          {!isTypingText ? (
                            <button
                              onClick={() => setIsTypingText(true)}
                              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.12] text-white/50 text-xs font-medium hover:bg-white/[0.05] hover:text-white/70 transition"
                            >
                              <Type size={12} strokeWidth={2} />
                              Add text
                            </button>
                          ) : (
                            <div className="space-y-2.5">
                              {/* Color row */}
                              <div className="flex items-center gap-2">
                                {TEXT_COLORS.map(c => (
                                  <button key={c.value} onClick={() => setDraftColor(c.value)}
                                    className={`shrink-0 rounded-full transition-transform ${draftColor === c.value ? "scale-125 ring-2 ring-white/60 ring-offset-1 ring-offset-[#0f0f0f]" : "opacity-70 hover:opacity-100"}`}
                                    style={{ width: 22, height: 22, backgroundColor: c.value, border: c.value === "#ffffff" ? "1px solid rgba(255,255,255,0.3)" : undefined }}
                                    aria-label={c.label}
                                  />
                                ))}
                                {/* Size toggle */}
                                <div className="ml-auto flex gap-1">
                                  {(["sm", "md", "lg"] as TextLayer["size"][]).map(s => (
                                    <button key={s} onClick={() => setDraftSize(s)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${draftSize === s ? "bg-[#b08d57] text-black" : "text-white/40 hover:text-white/60"}`}>
                                      {s.toUpperCase()}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {/* Text input row */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={draftText}
                                  onChange={e => setDraftText(e.target.value)}
                                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTextLayer(); } }}
                                  placeholder="Type something…"
                                  autoFocus
                                  className="flex-1 min-w-0 bg-white/[0.08] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#b08d57]/40"
                                />
                                <button onClick={addTextLayer}
                                  className="shrink-0 px-4 py-2 bg-[#b08d57] text-black rounded-xl text-xs font-bold hover:bg-[#9a7545] transition">
                                  Add
                                </button>
                                <button onClick={() => { setIsTypingText(false); setDraftText(""); }}
                                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.05] text-white/40 hover:text-white/70 transition">
                                  <X size={13} strokeWidth={2} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {error && <p className="px-4 pb-2 text-xs text-red-400">{error}</p>}

                        {/* ── Post story button ──────────────────────────────── */}
                        <div className="px-4 pb-5 shrink-0">
                          <button
                            onClick={handlePostStory}
                            disabled={isPostingStory}
                            className="w-full bg-[#b08d57] text-black hover:bg-[#9a7545] py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition"
                          >
                            {isPostingStory && <Loader2 size={14} className="animate-spin" />}
                            {isPostingStory ? "Posting…" : "Post Story"}
                          </button>
                        </div>

                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
