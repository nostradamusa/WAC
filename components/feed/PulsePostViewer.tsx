"use client";

import { NetworkPost, PostMediaItem } from "@/lib/types/network-feed";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  MessageCircle,
  Landmark,
  Building2,
  ArrowUpRight,
  ExternalLink,
  Share2,
  CheckCircle2,
} from "lucide-react";
import PostComments from "./PostComments";
import { ReactionIcon, SUPPORTED_REACTIONS } from "@/components/ui/ReactionIcon";
import { togglePostReaction, ReactionType } from "@/lib/services/feedService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds / 31536000 > 1) return Math.floor(seconds / 31536000) + "y";
  if (seconds / 2592000  > 1) return Math.floor(seconds / 2592000)  + "mo";
  if (seconds / 86400    > 1) return Math.floor(seconds / 86400)    + "d";
  if (seconds / 3600     > 1) return Math.floor(seconds / 3600)     + "h";
  if (seconds / 60       > 1) return Math.floor(seconds / 60)       + "m";
  return "now";
}

function getDisplayMediaItems(items?: PostMediaItem[], fallbackUrl?: string | null): PostMediaItem[] {
  if (items && items.length > 0) return [...items].sort((a, b) => a.order_index - b.order_index);
  if (fallbackUrl) return [{ url: fallbackUrl, media_type: "photo", order_index: 0 }];
  return [];
}

// ─── Media Stage ──────────────────────────────────────────────────────────────

function MediaStage({ items, fallbackUrl }: { items?: PostMediaItem[]; fallbackUrl?: string | null }) {
  const displayItems = getDisplayMediaItems(items, fallbackUrl);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (displayItems.length === 0) return null;

  const current      = displayItems[currentIndex];
  const isVideo      = current.media_type === "video";
  const hasMultiple  = displayItems.length > 1;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {isVideo ? (
        <video
          src={current.url}
          controls
          playsInline
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <div className="relative w-full h-full">
          <Image
            src={current.url}
            alt={`Photo ${currentIndex + 1}`}
            fill
            className="object-contain"
            sizes="(max-width: 1200px) 60vw, 800px"
          />
        </div>
      )}

      {hasMultiple && (
        <>
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-20 hover:bg-black/75 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(displayItems.length - 1, i + 1))}
            disabled={currentIndex === displayItems.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-20 hover:bg-black/75 transition"
          >
            <ChevronRight size={16} />
          </button>

          {/* Dot indicator */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
            {displayItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`pointer-events-auto rounded-full transition-all duration-200 ${
                  i === currentIndex ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Text Content Stage (no media) ────────────────────────────────────────────

function ContentStage({ content, authorName }: { content: string; authorName: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-12 bg-[#060606]">
      <div className="max-w-md text-center space-y-6">
        <p className="font-serif text-2xl leading-relaxed text-white/85 italic font-light">
          &ldquo;{content}&rdquo;
        </p>
        <p className="text-sm text-white/30 font-medium tracking-wide">— {authorName}</p>
      </div>
    </div>
  );
}

// ─── Viewer Inner ─────────────────────────────────────────────────────────────

type Props = { post: NetworkPost; onClose: () => void };

function ViewerInner({ post, onClose }: Props) {

  // ── Author resolution ────────────────────────────────────────────────────

  let authorName     = "Unknown";
  let authorAvatar: string | null = null;
  let authorHeadline = "";
  let authorLink     = "#";
  let isVerified     = false;
  let sourceLabel    = "";

  if (post.author_profile) {
    authorName     = post.author_profile.full_name || "Member";
    authorAvatar   = post.author_profile.avatar_url;
    authorHeadline = post.author_profile.headline || "Member";
    authorLink     = post.author_profile.username ? `/people/${post.author_profile.username}` : "#";
    isVerified     = post.author_profile.is_verified;
  } else if (post.author_business) {
    authorName     = post.author_business.name;
    authorAvatar   = post.author_business.logo_url;
    authorHeadline = post.author_business.business_type || "Business";
    authorLink     = `/businesses/${post.author_business.slug}`;
    isVerified     = post.author_business.is_verified;
    sourceLabel    = "Business";
  } else if (post.author_organization) {
    authorName     = post.author_organization.name;
    authorAvatar   = post.author_organization.logo_url;
    authorHeadline = post.author_organization.organization_type || "Organization";
    authorLink     = `/organizations/${post.author_organization.slug}`;
    isVerified     = post.author_organization.is_verified;
    sourceLabel    = "Official";
  }

  const isEntityPost  = post.source_type === "organization" || post.source_type === "business";
  const isGroupPost   = post.source_type === "group";
  const isEvent       = post.content_type === "event";
  const isDiscussion  = post.content_type === "discussion";
  const hasCTA        = !!(post.cta_url && post.cta_label);
  const displayItems  = getDisplayMediaItems(post.media_items, post.image_url);
  const hasMedia      = displayItems.length > 0;

  // ── Reaction state ───────────────────────────────────────────────────────

  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(post.user_reaction_type || null);
  const [reactionCount, setReactionCount]   = useState(post.likes_count || 0);
  const [isReacting, setIsReacting]         = useState(false);
  const [showReactions, setShowReactions]   = useState(false);
  const [toast, setToast]                   = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleReaction = async (type: ReactionType) => {
    if (isReacting) return;
    setIsReacting(true);
    const prev = activeReaction;
    if (activeReaction === type) {
      setActiveReaction(null);
      setReactionCount((c) => c - 1);
    } else {
      if (!activeReaction) setReactionCount((c) => c + 1);
      setActiveReaction(type);
    }
    try {
      await togglePostReaction(post.id, type);
    } catch {
      setActiveReaction(prev);
      if (prev === type) setReactionCount((c) => c + 1);
      else if (!prev) setReactionCount((c) => c - 1);
    } finally {
      setIsReacting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/post/${post.id}`)
      .then(() => showToast("Link copied!"));
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ backgroundColor: "rgba(0,0,0,0.88)" }}
    >
      {/* Backdrop — click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Shell */}
      <div
        className="relative z-10 flex w-full max-w-[1080px] rounded-2xl overflow-hidden border border-white/[0.07] shadow-[0_40px_120px_rgba(0,0,0,0.85)] animate-in zoom-in-95 duration-200"
        style={{ height: "min(90dvh, 760px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left: primary content / media stage ─────────────────────── */}
        <div className="flex-1 min-w-0 relative bg-[#050505]">

          {/* Close button — always on top-left */}
          <button
            onClick={onClose}
            className="absolute top-3 left-3 z-30 w-9 h-9 rounded-full bg-black/55 border border-white/[0.12] backdrop-blur-sm flex items-center justify-center text-white/65 hover:text-white hover:bg-black/75 transition"
          >
            <X size={15} />
          </button>

          {hasMedia ? (
            <div className="absolute inset-0">
              <MediaStage items={post.media_items} fallbackUrl={post.image_url} />
            </div>
          ) : (
            <div className="absolute inset-0">
              <ContentStage content={post.content} authorName={authorName} />
            </div>
          )}
        </div>

        {/* ── Right: social context panel ─────────────────────────────── */}
        <div className="w-[360px] shrink-0 bg-[#0d0d0d] border-l border-white/[0.06] flex flex-col">

          {/* Author header — fixed at top of panel */}
          <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
            <Link href={authorLink} onClick={onClose} className="flex items-center gap-3 group">
              <div className={`relative shrink-0 overflow-hidden bg-white/5 border border-white/[0.10] group-hover:border-[#b08d57]/40 transition-colors ${isEntityPost ? "w-10 h-10 rounded-xl" : "w-10 h-10 rounded-full"}`}>
                {authorAvatar ? (
                  <Image src={authorAvatar} alt={authorName} fill sizes="40px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-[#b08d57] text-sm">
                    {authorName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-white group-hover:text-[#b08d57] transition-colors truncate">
                    {authorName}
                  </span>
                  {isVerified && (
                    <svg className="w-3.5 h-3.5 shrink-0 text-[#b08d57]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10.081.9C11.239.199 12.761.199 13.919.9l1.455.882c.49.297 1.05.438 1.611.408l1.7-.091c1.353-.072 2.553.844 2.89 2.158l.423 1.64c.143.553.438 1.05.85 1.45L24 8.527c.974.945.974 2.505 0 3.45l-1.152 1.118c-.412.4-.707.897-.85 1.45l-.423 1.64c-.337 1.314-1.537 2.23-2.89 2.158l-1.7-.091c-.56-.03-1.121.111-1.611.408l-1.455.882c-1.158.701-2.68.701-3.838 0l-1.455-.882c-.49-.297-1.05-.438-1.611-.408l-1.7.091c-1.353.072-2.553-.844-2.89-2.158l-.423-1.64c-.143-.553-.438-1.05-.85-1.45L0 11.977c-.974-.945-.974-2.505 0-3.45l1.152-1.118c.412-.4.707-.897.85-1.45l.423-1.64c.337-1.314 1.537-2.23 2.89-2.158l1.7.091c.56.03 1.121-.111 1.611-.408L10.081.9z" />
                    </svg>
                  )}
                </div>
                <p className="text-[11px] text-white/40 truncate mt-0.5">
                  {authorHeadline} · {timeAgo(post.created_at)}
                </p>
              </div>
            </Link>

            {/* WAC context chips */}
            {(isEvent || isGroupPost || isDiscussion || (isEntityPost && sourceLabel)) && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {isEvent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#b08d57]/10 border border-[#b08d57]/20 text-[#b08d57]/80 text-[10px] font-semibold">
                    <Calendar size={9} /> Event
                  </span>
                )}
                {isGroupPost && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-white/50 text-[10px] font-semibold">
                    <Users size={9} /> Group Discussion
                  </span>
                )}
                {isDiscussion && !isGroupPost && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-white/50 text-[10px] font-semibold">
                    <MessageCircle size={9} /> Discussion
                  </span>
                )}
                {isEntityPost && sourceLabel && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                    post.source_type === "organization"
                      ? "bg-[#b08d57]/[0.08] border-[#b08d57]/15 text-[#b08d57]/60"
                      : "bg-white/[0.04] border-white/10 text-white/40"
                  }`}>
                    {post.source_type === "organization"
                      ? <Landmark size={9} />
                      : <Building2 size={9} />}
                    {sourceLabel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Scrollable body — caption + CTA + engagement + comments */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* Caption (only shown in panel when there is media — otherwise text is the left stage) */}
            {post.content && hasMedia && (
              <div className="px-5 py-4 border-b border-white/[0.05]">
                <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            )}

            {/* CTA */}
            {hasCTA && (
              <div className="px-5 py-4 border-b border-white/[0.05]">
                <a
                  href={post.cta_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isEvent
                      ? "bg-[var(--accent)] text-black hover:bg-[#F3E5AB] shadow-md shadow-[var(--accent)]/15"
                      : "bg-white/[0.05] text-white/80 hover:bg-white/[0.09] border border-white/10"
                  }`}
                >
                  <span>{post.cta_label}</span>
                  <ArrowUpRight size={14} strokeWidth={2.5} />
                </a>
              </div>
            )}

            {/* Engagement row */}
            <div className="px-5 py-3 border-b border-white/[0.05] flex items-center gap-3 shrink-0">
              {/* Reaction trigger */}
              <div
                className="relative"
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
              >
                <button
                  onClick={() => handleReaction(activeReaction || "like")}
                  disabled={isReacting}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    activeReaction ? "text-[#b08d57]" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <ReactionIcon
                    type={activeReaction || "like"}
                    size={18}
                    active={!!activeReaction}
                    animateOnClick={false}
                    className={activeReaction ? "drop-shadow-[0_0_6px_rgba(176,141,87,0.6)]" : ""}
                  />
                  {reactionCount > 0 && <span>{reactionCount.toLocaleString()}</span>}
                </button>

                {showReactions && (
                  <div className="absolute bottom-full left-0 pb-2 z-50 w-max">
                    <div
                      className="bg-[#1a1a1a] border border-white/10 rounded-full px-3 py-2 flex gap-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                      onClick={() => setShowReactions(false)}
                    >
                      {SUPPORTED_REACTIONS.map(({ type }) => (
                        <button
                          key={type}
                          onClick={(e) => { e.stopPropagation(); handleReaction(type); }}
                          className="p-1"
                        >
                          <ReactionIcon
                            type={type}
                            size={24}
                            active={activeReaction === type}
                            showTooltip={false}
                            className="hover:-translate-y-1.5 hover:scale-110"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <span className="text-white/15">·</span>

              <span className="text-[11px] text-white/35">
                {post.comments_count > 0
                  ? `${post.comments_count.toLocaleString()} ${post.comments_count === 1 ? "comment" : "comments"}`
                  : "No comments yet"}
              </span>

              {/* Right-side share actions */}
              <div className="ml-auto flex items-center gap-2.5">
                <button
                  onClick={handleCopyLink}
                  title="Copy link"
                  className="text-white/30 hover:text-white/65 transition"
                >
                  <ExternalLink size={14} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("open-mini-chat", {
                        detail: { text: `Check out this post: ${window.location.origin}/post/${post.id}` },
                      })
                    );
                    onClose();
                  }}
                  title="Send in WAC Message"
                  className="text-white/30 hover:text-white/65 transition"
                >
                  <Share2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Comments thread */}
            <div className="px-5 pt-3 pb-4">
              <PostComments postId={post.id} />
            </div>

          </div>
        </div>
      </div>

      {/* Toast */}
      {toast &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none animate-in slide-in-from-top-5 fade-in duration-300">
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-2xl border border-white/10 bg-[#1a1a1a]/95 text-white backdrop-blur-md">
              <CheckCircle2 size={15} className="text-[#b08d57]" strokeWidth={2.5} />
              <span className="text-sm font-semibold whitespace-nowrap">{toast}</span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

// ─── Public export — portal wrapper ──────────────────────────────────────────

export default function PulsePostViewer({ post, onClose }: Props) {
  if (typeof document === "undefined") return null;
  return createPortal(<ViewerInner post={post} onClose={onClose} />, document.body);
}
