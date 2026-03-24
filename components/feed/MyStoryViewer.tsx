"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Eye } from "lucide-react";

const STORY_DURATION_MS = 6000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type StoryViewer = { name: string; avatarUrl: string | null };

export type MyStory = {
  id: string;
  bgGradient?: string;
  mediaUrl?: string | null;
  isVideo?: boolean;
  content?: string;
  timeAgo: string;
  viewedBy: StoryViewer[];
  mentions?: { name: string; slug?: string; kind?: string }[];
  location?: string;
};

type Props = {
  authorName: string;
  authorAvatar: string | null;
  stories: MyStory[];
  onClose: () => void;
  isAuthor?: boolean;
  onSendReply?: (storyId: string, messageOrEmoji: string) => void;
};

// ─── Inner component ──────────────────────────────────────────────────────────

function ViewerInner({ authorName, authorAvatar, stories, onClose, isAuthor = true, onSendReply }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress]         = useState(0);
  const [isPaused, setIsPaused]         = useState(false);
  const [showViewers, setShowViewers]   = useState(false);

  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const goNextRef   = useRef<() => void>(() => {});

  const current    = stories[currentIndex];
  if (!current) return null;
  const totalViews = current.viewedBy?.length ?? 0;

  const goNext = useCallback(() => {
    setShowViewers(false);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    setShowViewers(false);
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Always keep goNextRef fresh so the interval closure never goes stale
  goNextRef.current = goNext;

  // ── Reset progress when story changes ────────────────────────────────────
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  // ── Progress ticker ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused) return;

    const TICK    = 50; // ms
    const STEP    = (TICK / STORY_DURATION_MS) * 100;

    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + STEP;
        if (next >= 100) {
          clearInterval(intervalRef.current);
          setTimeout(() => goNextRef.current(), 0);
          return 100;
        }
        return next;
      });
    }, TICK);

    return () => clearInterval(intervalRef.current);
  }, [currentIndex, isPaused]);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowRight")  goNext();
      if (e.key === "ArrowLeft")   goPrev();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, goNext, goPrev]);

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Stage tap handler ─────────────────────────────────────────────────────
  const handleStageTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't advance if the viewer list is open — tap closes it instead
    if (showViewers) { setShowViewers(false); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    if (x < rect.width / 2) goPrev();
    else goNext();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[500] bg-[#050505] flex items-center justify-center animate-in fade-in duration-200"
    >
      {/* Desktop backdrop — click outside phone stage to close */}
      <div className="absolute inset-0 hidden md:block" onClick={onClose} />

      {/* Phone stage (same geometry as story creator) */}
      <div
        className="
          relative flex flex-col
          w-full h-full
          md:w-[390px] md:h-[min(86dvh,693px)]
          md:rounded-[40px] md:border md:border-white/[0.08]
          md:shadow-[0_40px_100px_rgba(0,0,0,0.75)]
          overflow-hidden bg-[#111]
          select-none
        "
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Progress bars ──────────────────────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-[3px] px-3 pt-[calc(env(safe-area-inset-top,0px)+10px)] pt-3">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-[2px] bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width:
                    i < currentIndex
                      ? "100%"
                      : i === currentIndex
                      ? `${progress}%`
                      : "0%",
                  transition: i === currentIndex && !isPaused ? "none" : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Author header ───────────────────────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-2.5 px-4 pt-8">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#b08d57] shrink-0">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#b08d57]/20 flex items-center justify-center font-bold text-[#b08d57] text-sm">
                {authorName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="text-white text-[12.5px] font-semibold leading-none drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {authorName}
            </p>
            <p className="text-white/50 text-[10px] mt-0.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {current.timeAgo} ago
            </p>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="ml-auto w-9 h-9 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Story stage — full bleed, handles taps ──────────────────────── */}
        <div
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={handleStageTap}
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
          onPointerLeave={() => setIsPaused(false)}
        >
          {/* Background */}
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                current.bgGradient ??
                "linear-gradient(135deg, #1a1207 0%, #0c0a08 50%, #121010 100%)",
            }}
          >
            {current.mediaUrl && !current.isVideo && (
              <img
                src={current.mediaUrl}
                alt="Story"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            )}
            {current.mediaUrl && current.isVideo && (
              <video
                src={current.mediaUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {current.content && (
              <p
                className="relative z-10 px-8 text-center font-serif text-2xl text-white/90 leading-relaxed italic font-light"
                style={{ textShadow: "0 2px 20px rgba(0,0,0,0.95)" }}
              >
                {current.content}
              </p>
            )}
          </div>

          {/* Mentions & Location overlay */}
          {(current.mentions?.length || current.location) && (
            <div className="absolute inset-x-0 bottom-28 z-20 flex flex-col items-center gap-2 pointer-events-none">
              {current.mentions?.map((m, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!m.slug && !m.name) return;
                    const path = (m.kind === "organization" || m.kind === "business") 
                      ? `/profile/entities/${m.slug || m.name}`
                      : `/${m.slug || m.name}`;
                    onClose();
                    router.push(path);
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-white text-xs font-semibold shadow-lg shrink-0 pointer-events-auto hover:bg-white/30 hover:scale-105 active:scale-95 transition-all"
                >
                  @{m.name}
                </button>
              ))}
              {current.location && (
                <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-white text-xs font-medium shadow-lg shrink-0 pointer-events-auto cursor-pointer hover:bg-black/60 transition flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  {current.location}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Seen-by panel / Reply panel — z above stage ─────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 z-30">

          {/* Expanded viewer list (Author only) */}
          {isAuthor && showViewers && (
            <div
              className="bg-[#111]/96 backdrop-blur-xl border-t border-white/[0.08] px-5 pt-4 pb-6 max-h-[52%] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.1em]">
                  Seen by {totalViews}
                </p>
                <button
                  onClick={() => setShowViewers(false)}
                  className="text-white/30 hover:text-white/60 transition"
                >
                  <X size={14} />
                </button>
              </div>
              {totalViews === 0 ? (
                <p className="text-sm text-white/30 text-center py-4">
                  No views yet
                </p>
              ) : (
                <div className="space-y-3">
                  {current.viewedBy.map((viewer, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/[0.07] border border-white/[0.10] flex items-center justify-center shrink-0 overflow-hidden">
                        {viewer.avatarUrl ? (
                          <img
                            src={viewer.avatarUrl}
                            alt={viewer.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-white/40">
                            {viewer.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-white/75">
                        {viewer.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collapsed seen-by pill — always anchored bottom-left (Author only) */}
          {isAuthor && !showViewers && (
            <div className="px-4 pb-[max(env(safe-area-inset-bottom,0px),20px)] pb-5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewers(true);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className="flex items-center gap-2 bg-black/45 backdrop-blur-xl border border-white/[0.12] px-3.5 py-2 rounded-full hover:bg-black/60 transition"
              >
                {totalViews > 0 && (
                  <div className="flex -space-x-1.5 shrink-0">
                    {current.viewedBy.slice(0, 3).map((v, i) => (
                      <div
                        key={i}
                        className="w-[18px] h-[18px] rounded-full bg-white/[0.12] border border-black flex items-center justify-center overflow-hidden"
                      >
                        {v.avatarUrl ? (
                          <img src={v.avatarUrl} alt={v.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[7px] font-bold text-white/50">
                            {v.name.charAt(0)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <Eye size={12} className="text-white/55 shrink-0" strokeWidth={1.8} />
                <span className="text-[11.5px] font-semibold text-white/65">
                  {totalViews === 0
                    ? "No views yet"
                    : `${totalViews} ${totalViews === 1 ? "view" : "views"}`}
                </span>
              </button>
            </div>
          )}

          {/* Bottom Reply Bar (Non-Author) */}
          {!isAuthor && (
            <div
              className="px-4 pb-6 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Send message..."
                  className="w-full bg-black/40 border-[1.5px] border-white/30 rounded-full py-3 px-5 text-white placeholder:text-white/80 text-[15px] focus:outline-none focus:border-white/60 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      onSendReply?.(current.id, e.currentTarget.value.trim());
                      e.currentTarget.value = "";
                      onClose();
                    }
                  }}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => setIsPaused(false)}
                />
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0 overflow-visible">
                {["👍", "❤️", "😂", "😲", "😢", "😡"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onSendReply?.(current.id, emoji);
                      onClose();
                    }}
                    className="text-[26px] hover:scale-125 transition-transform duration-200 active:scale-95 leading-none"
                    style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Portal wrapper ───────────────────────────────────────────────────────────

export default function MyStoryViewer(props: Props) {
  if (typeof document === "undefined") return null;
  return createPortal(<ViewerInner {...props} />, document.body);
}
