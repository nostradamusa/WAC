"use client";

import { NetworkPost, ContentType, PostIntent, SourceType } from "@/lib/types/network-feed";
import {
  MessageCircle, Share2, MoreHorizontal, Repeat, ExternalLink, X, CheckCircle2,
  Calendar, MessageSquare, Building2, Landmark, Users, ArrowUpRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { togglePostReaction, ReactionType, deletePost, editPost } from "@/lib/services/feedService";
import PostComments from "./PostComments";
import { ReactionIcon, SUPPORTED_REACTIONS } from "@/components/ui/ReactionIcon";
import { useActor } from "@/components/providers/ActorProvider";
import { supabase } from "@/lib/supabase";

// ─── V1 Intent config ─────────────────────────────────────────────────────────

const INTENT_CONFIG: Record<string, { label: string; cls: string }> = {
  announcement: { label: "Announcement", cls: "text-[#D4AF37]/80 bg-[#D4AF37]/10 border-[#D4AF37]/20" },
  opportunity:  { label: "Opportunity",  cls: "text-sky-400/80 bg-sky-500/10 border-sky-500/20" },
  job:          { label: "Hiring",       cls: "text-violet-400/80 bg-violet-500/10 border-violet-500/20" },
  volunteer:    { label: "Volunteer",    cls: "text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20" },
  fundraiser:   { label: "Fundraiser",   cls: "text-rose-400/80 bg-rose-500/10 border-rose-500/20" },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s / 31536000 > 1) return Math.floor(s / 31536000) + "y";
  if (s / 2592000 > 1)  return Math.floor(s / 2592000)  + "mo";
  if (s / 86400 > 1)    return Math.floor(s / 86400)    + "d";
  if (s / 3600 > 1)     return Math.floor(s / 3600)     + "h";
  if (s / 60 > 1)       return Math.floor(s / 60)       + "m";
  return "now";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PostCard({ post }: { post: NetworkPost }) {

  // ── V1 derived state (backward-safe: old posts may not have these columns) ──
  const contentType: ContentType = post.content_type ?? "post";
  const postIntent: PostIntent   = post.post_intent  ?? null;
  const sourceType: SourceType   = post.source_type  ?? (
    post.author_organization_id ? "organization" :
    post.author_business_id     ? "business" : "user"
  );

  const isEntityPost  = sourceType === "organization" || sourceType === "business";
  const isGroupPost   = sourceType === "group";
  const isEvent       = contentType === "event";
  const isDiscussion  = contentType === "discussion";
  const hasCTA        = !!(post.cta_url && post.cta_label);
  const showIntent    = contentType === "post" && postIntent && postIntent !== "update" && !!INTENT_CONFIG[postIntent];

  // ── Existing state ────────────────────────────────────────────────────────
  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(post.user_reaction_type || null);
  const [reactionCount, setReactionCount] = useState(post.likes_count || 0);
  const [isReacting, setIsReacting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  // Discussions open comments by default
  const [showComments, setShowComments] = useState(isDiscussion);
  const [showOptions, setShowOptions] = useState(false);
  const [showRepostOptions, setShowRepostOptions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostThoughts, setRepostThoughts] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [reactionBreakdown, setReactionBreakdown] = useState<any[]>([]);
  const [uniqueReactionIcons, setUniqueReactionIcons] = useState<ReactionType[]>(post.likes_count ? ["like"] : []);
  const [showReactionsModal, setShowReactionsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const { currentActor } = useActor();
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const repostOptionsRef = useRef<HTMLDivElement>(null);
  const shareOptionsRef = useRef<HTMLDivElement>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user.id) setCurrentUserId(data.session.user.id);
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) setShowOptions(false);
      if (repostOptionsRef.current && !repostOptionsRef.current.contains(e.target as Node)) setShowRepostOptions(false);
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(e.target as Node)) setShowShareOptions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [post.id]);

  // Load reaction breakdown only when the modal is opened (avoids N+1 on feed load)
  useEffect(() => {
    if (!showReactionsModal || reactionBreakdown.length > 0) return;
    supabase
      .from("feed_likes")
      .select("reaction_type, created_at, profile:profiles!profile_id(id, full_name, avatar_url, headline, is_verified)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setReactionBreakdown(data);
          const types = Array.from(new Set(data.map((d) => d.reaction_type))).slice(0, 3) as ReactionType[];
          setUniqueReactionIcons(types);
        }
      });
  }, [showReactionsModal]);

  // ── Author resolution ─────────────────────────────────────────────────────
  let authorName     = "Unknown";
  let authorAvatar: string | null = null;
  let authorHeadline = "";
  let authorLink     = "#";
  let isVerified     = false;

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
  } else if (post.author_organization) {
    authorName     = post.author_organization.name;
    authorAvatar   = post.author_organization.logo_url;
    authorHeadline = post.author_organization.organization_type || "Organization";
    authorLink     = `/organizations/${post.author_organization.slug}`;
    isVerified     = post.author_organization.is_verified;
  }

  const isOwner = currentUserId === post.author_profile_id;

  // ── Handlers (unchanged) ──────────────────────────────────────────────────
  const handleReaction = async (type: ReactionType) => {
    if (isReacting) return;
    setIsReacting(true);
    setShowReactions(false);
    const previousReaction = activeReaction;

    const updateBreakdown = (newType: ReactionType | null) => {
      setReactionBreakdown((prev) => {
        let next = [...prev];
        const idx = next.findIndex((r) => r.profile?.id === currentUserId);
        if (newType === null) {
          if (idx >= 0) next.splice(idx, 1);
        } else {
          if (idx >= 0) next[idx] = { ...next[idx], reaction_type: newType };
          else next.unshift({ reaction_type: newType, created_at: new Date().toISOString(), profile: { id: currentUserId, full_name: currentActor?.name || "You", avatar_url: currentActor?.avatar_url, headline: currentActor?.type || "Member", is_verified: false } });
        }
        setUniqueReactionIcons(Array.from(new Set(next.map((d) => d.reaction_type))).slice(0, 3) as ReactionType[]);
        return next;
      });
    };

    if (activeReaction === type) {
      setActiveReaction(null); setReactionCount((p) => p - 1); updateBreakdown(null);
    } else {
      if (!activeReaction) setReactionCount((p) => p + 1);
      setActiveReaction(type); updateBreakdown(type);
    }

    try {
      const { success } = await togglePostReaction(post.id, type);
      if (!success) {
        setActiveReaction(previousReaction); updateBreakdown(previousReaction);
        if (activeReaction === type) setReactionCount((p) => p + 1);
        else if (!previousReaction) setReactionCount((p) => p - 1);
      }
    } catch {
      setActiveReaction(previousReaction); updateBreakdown(previousReaction);
      if (activeReaction === type) setReactionCount((p) => p + 1);
      else if (!previousReaction) setReactionCount((p) => p - 1);
    } finally {
      setIsReacting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    setIsDeleting(true);
    const { success } = await deletePost(post.id);
    if (success) window.location.reload();
    else { setIsDeleting(false); showToast("Failed to delete post", "error"); }
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim()) return;
    setIsEditSubmitting(true);
    const { success } = await editPost(post.id, editContent);
    setIsEditSubmitting(false);
    if (success) { setIsEditing(false); post.content = editContent; }
    else alert("Failed to update post");
  };

  const handleRepost = async () => {
    setShowRepostOptions(false); setIsReacting(true);
    try {
      const targetId = post.original_post ? post.original_post.id : post.id;
      const { error } = await supabase.from("feed_posts").insert({
        submitted_by: currentUserId, author_profile_id: currentUserId,
        content: "", post_type: "general", content_type: "post", original_post_id: targetId,
      });
      if (error) throw error;
      showToast("Successfully Reposted");
    } catch (e: any) { showToast("Failed to repost: " + e.message, "error"); }
    finally { setIsReacting(false); }
  };

  const handleRepostWithThoughts = () => {
    if (!repostThoughts.trim()) return;
    setIsReacting(true);
    const targetId = post.original_post ? post.original_post.id : post.id;
    supabase.from("feed_posts").insert({
      submitted_by: currentUserId, author_profile_id: currentUserId,
      content: repostThoughts, post_type: "general", content_type: "post", original_post_id: targetId,
    }).then(({ error }) => {
      setIsReacting(false); setShowRepostModal(false); setRepostThoughts("");
      if (error) showToast("Failed to repost: " + error.message, "error");
      else showToast("Successfully Reposted");
    });
  };

  const handleCopyLink = () => {
    setShowShareOptions(false);
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`).then(() => showToast("Link copied!"));
  };

  const handleNativeShare = async () => {
    setShowShareOptions(false);
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Post by ${authorName} on WAC`, text: post.content?.substring(0, 100) || "", url }); }
      catch { /* cancelled */ }
    } else handleCopyLink();
  };

  if (isDeleting) return null;

  // ── Card-level styling ─────────────────────────────────────────────────────
  const cardBorder = isEntityPost
    ? "border border-[var(--accent)]/20 hover:border-[var(--accent)]/40"
    : "hover:border-[var(--accent)]/30";

  return (
    <div className={`wac-card p-5 mb-4 transition-colors relative ${cardBorder}`}>

      {/* ── Repost banner ── */}
      {post.original_post_id && (
        <div className="flex items-center gap-2 text-[11px] font-semibold text-white/40 mb-3 pb-3 border-b border-white/5">
          <Repeat size={13} strokeWidth={2} className="text-[#D4AF37]/60" />
          <span>{authorName} reposted</span>
        </div>
      )}

      {/* ── Format / source attribution strip ── */}
      {(isEvent || isDiscussion || isGroupPost) && (
        <div className={`flex items-center gap-1.5 mb-3 pb-3 border-b text-[11px] font-semibold ${
          isEvent
            ? "text-[#D4AF37]/70 border-[#D4AF37]/10"
            : "text-white/35 border-white/[0.06]"
        }`}>
          {isEvent      && <Calendar      size={11} />}
          {isDiscussion && !isGroupPost && <MessageSquare size={11} />}
          {isGroupPost  && <Users         size={11} />}
          <span>
            {isEvent      ? "Event"
            : isGroupPost ? "Group Discussion"
            :               "Discussion"}
          </span>
          {isEvent && hasCTA && (
            <span className="ml-auto text-[10px] text-white/25 font-normal">
              CTA below ↓
            </span>
          )}
        </div>
      )}

      {/* ── Author header ── */}
      <div className="flex items-start justify-between mb-3">
        <Link href={authorLink} className="flex items-center gap-3 group min-w-0">
          {/* Avatar */}
          <div className={`relative shrink-0 overflow-hidden bg-white/5 border border-[var(--border)] group-hover:border-[var(--accent)]/50 transition-colors ${
            isEntityPost ? "w-11 h-11 rounded-xl" : "w-11 h-11 rounded-full"
          }`}>
            {authorAvatar ? (
              <Image src={authorAvatar} alt={authorName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[#D4AF37] text-sm">
                {authorName.charAt(0)}
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-[0.9rem] leading-tight group-hover:text-[var(--accent)] transition-colors truncate">
                {authorName}
              </h3>
              {isVerified && (
                <svg className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.081.9C11.239.199 12.761.199 13.919.9l1.455.882c.49.297 1.05.438 1.611.408l1.7-.091c1.353-.072 2.553.844 2.89 2.158l.423 1.64c.143.553.438 1.05.85 1.45L24 8.527c.974.945.974 2.505 0 3.45l-1.152 1.118c-.412.4-.707.897-.85 1.45l-.423 1.64c-.337 1.314-1.537 2.23-2.89 2.158l-1.7-.091c-.56-.03-1.121.111-1.611.408l-1.455.882c-1.158.701-2.68.701-3.838 0l-1.455-.882c-.49-.297-1.05-.438-1.611-.408l-1.7.091c-1.353.072-2.553-.844-2.89-2.158l-.423-1.64c-.143-.553-.438-1.05-.85-1.45L0 11.977c-.974-.945-.974-2.505 0-3.45l1.152-1.118c.412-.4.707-.897.85-1.45l.423-1.64c.337-1.314 1.537-2.23 2.89-2.158l1.7.091c.56.03 1.121-.111 1.611-.408L10.081.9z" />
                </svg>
              )}
              {/* Entity type badge — inline with name, very subtle */}
              {isEntityPost && (
                <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                  sourceType === "organization"
                    ? "bg-[#D4AF37]/8 text-[#D4AF37]/55 border-[#D4AF37]/15"
                    : "bg-white/[0.06] text-white/40 border-white/10"
                }`}>
                  {sourceType === "organization"
                    ? <><Landmark size={8} />Official</>
                    : <><Building2 size={8} />Business</>
                  }
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/45 leading-tight mt-0.5 truncate">
              {authorHeadline} · {timeAgo(post.created_at)}
            </p>
          </div>
        </Link>

        {isOwner && (
          <div className="relative shrink-0 ml-2" ref={optionsRef}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="opacity-40 hover:opacity-90 hover:text-[var(--accent)] transition p-1"
            >
              <MoreHorizontal size={17} />
            </button>
            {showOptions && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                <button onClick={() => { setIsEditing(true); setShowOptions(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition">Edit</button>
                <div className="h-px bg-white/5" />
                <button onClick={() => { handleDelete(); setShowOptions(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition">Delete</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Intent badge ── (only for post format with a non-update intent) */}
      {showIntent && (
        <div className="mb-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${INTENT_CONFIG[postIntent!].cls}`}>
            {INTENT_CONFIG[postIntent!].label}
          </span>
        </div>
      )}

      {/* ── Content ── */}
      <div className="mb-4">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-black/20 border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs text-white/50 hover:text-white transition">Cancel</button>
              <button onClick={handleEditSubmit} disabled={isEditSubmitting} className="px-4 py-1.5 text-xs bg-[var(--accent)] text-black font-bold rounded-lg hover:bg-[#F2D06B] transition">Save</button>
            </div>
          </div>
        ) : (
          post.content && (
            <p className={`leading-relaxed whitespace-pre-wrap ${
              isDiscussion ? "text-[0.9rem] opacity-90" : "text-sm opacity-90"
            }`}>
              {post.content}
            </p>
          )
        )}

        {post.image_url && (
          <div className="mt-3 relative w-full h-[280px] rounded-xl overflow-hidden border border-[var(--border)]">
            <Image src={post.image_url} alt="Post media" fill className="object-cover" />
          </div>
        )}

        {/* Embedded original post (repost preview) */}
        {post.original_post && (
          <div className="mt-4 border border-[var(--border)] rounded-xl p-4 bg-white/[0.025]">
            <div className="flex items-center gap-2 mb-2">
              {post.original_post.author_profile?.avatar_url ? (
                <Image src={post.original_post.author_profile.avatar_url} alt="" width={22} height={22} className="rounded-full" />
              ) : (
                <div className="w-[22px] h-[22px] rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-[#D4AF37]">
                  {post.original_post.author_profile?.full_name?.charAt(0) || "U"}
                </div>
              )}
              <span className="text-xs font-semibold truncate">{post.original_post.author_profile?.full_name || "Member"}</span>
              <span className="text-[11px] text-white/40 ml-auto shrink-0">{timeAgo(post.original_post.created_at)}</span>
            </div>
            <p className="text-sm opacity-80 leading-relaxed whitespace-pre-wrap line-clamp-4">{post.original_post.content}</p>
            {post.original_post.image_url && (
              <div className="mt-2 relative w-full h-[130px] rounded-lg overflow-hidden border border-white/10">
                <Image src={post.original_post.image_url} alt="" fill className="object-cover" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CTA block ── */}
      {hasCTA && !isEditing && (
        <a
          href={post.cta_url!}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm transition-all mb-4 ${
            isEvent
              ? "bg-[var(--accent)] text-black hover:bg-[#F3E5AB] shadow-md shadow-[var(--accent)]/15"
              : "bg-white/[0.05] text-white/80 hover:bg-white/[0.09] border border-white/10"
          }`}
        >
          <span>{post.cta_label}</span>
          <ArrowUpRight size={14} strokeWidth={2.5} />
        </a>
      )}

      {/* ── Social proof bar ── */}
      {(reactionCount > 0 || post.comments_count > 0 || (post.repost_count ?? 0) > 0) && (
        <div className="flex justify-between items-center text-[11px] text-white/45 pb-3 px-1">
          <div
            className="flex items-center gap-1.5 hover:text-[var(--accent)] cursor-pointer transition-colors"
            onClick={() => setShowReactionsModal(true)}
          >
            {reactionCount > 0 && (
              <>
                <div className="flex -space-x-1">
                  {uniqueReactionIcons.map((t, i) => (
                    <ReactionIcon key={t || i} type={t || "like"} size={13} active={false} className={`relative bg-[#1a1a1a] rounded-full`} />
                  ))}
                </div>
                <span className="font-medium ml-0.5">{reactionCount.toLocaleString()}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {post.comments_count > 0 && (
              <span className="hover:text-[var(--accent)] cursor-pointer transition-colors" onClick={() => setShowComments(!showComments)}>
                {post.comments_count.toLocaleString()} {post.comments_count === 1 ? "comment" : "comments"}
              </span>
            )}
            {post.comments_count > 0 && (post.repost_count ?? 0) > 0 && <span>·</span>}
            {(post.repost_count ?? 0) > 0 && (
              <span>{post.repost_count!.toLocaleString()} {post.repost_count === 1 ? "repost" : "reposts"}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="flex items-stretch border-t border-white/[0.06] -mx-5 px-2 relative">

        {/* React */}
        <div
          className="relative flex-1 flex items-center justify-center"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <button
            aria-label={activeReaction ? `Remove ${activeReaction} reaction` : "React to post"}
            onTouchStart={() => {
              isLongPress.current = false;
              pressTimer.current = setTimeout(() => { isLongPress.current = true; setShowReactions(true); }, 400);
            }}
            onTouchEnd={() => { if (pressTimer.current) clearTimeout(pressTimer.current); }}
            onTouchMove={() => { if (pressTimer.current) clearTimeout(pressTimer.current); }}
            onContextMenu={(e) => { if (isLongPress.current) e.preventDefault(); }}
            onClick={(e) => { if (isLongPress.current) { e.preventDefault(); return; } handleReaction(activeReaction || "like"); }}
            disabled={isReacting}
            className={`group flex items-center justify-center w-full py-3 rounded-xl transition select-none ${
              activeReaction
                ? "text-[#D4AF37]"
                : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
            }`}
          >
            <ReactionIcon
              type={activeReaction || "like"}
              size={20}
              active={!!activeReaction}
              animateOnClick={false}
              className={activeReaction ? "drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" : "group-hover:scale-110 transition-transform"}
            />
          </button>

          {showReactions && (
            <div className="absolute bottom-full left-0 pb-2 z-50 w-max">
              <div
                className="bg-[#1a1a1a] border border-white/10 rounded-full px-3 py-2 flex gap-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200"
                onClick={() => setShowReactions(false)}
              >
                {SUPPORTED_REACTIONS.map(({ type }) => (
                  <button key={type} onClick={(e) => { e.stopPropagation(); handleReaction(type); }} className="p-1" aria-label={type}>
                    <ReactionIcon type={type} size={28} active={activeReaction === type} showTooltip={false} className="hover:-translate-y-2 hover:scale-110" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comment */}
        <div className="flex-1 flex items-center justify-center">
          <button
            aria-label={isDiscussion ? "Reply" : "Comment"}
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center justify-center w-full py-3 rounded-xl transition ${
              showComments
                ? "text-[#D4AF37]"
                : isDiscussion
                ? "text-white/55 hover:text-white/80 hover:bg-white/[0.04]"
                : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
            }`}
          >
            <MessageCircle
              size={20}
              strokeWidth={showComments ? 2.2 : 1.6}
              className={showComments ? "drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" : ""}
            />
          </button>
        </div>

        {/* Repost */}
        <div className="relative flex-1 flex items-center justify-center" ref={repostOptionsRef}>
          <button
            aria-label="Repost"
            onClick={() => setShowRepostOptions(!showRepostOptions)}
            className="flex items-center justify-center w-full py-3 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition"
          >
            <Repeat size={20} strokeWidth={1.6} />
          </button>
          {showRepostOptions && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%+4px)] min-w-[180px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
              <button onClick={handleRepost} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3"><Repeat size={15} strokeWidth={1.5} /><span>Repost</span></button>
              <div className="h-px bg-white/5" />
              <button onClick={() => { setShowRepostOptions(false); setShowRepostModal(true); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3"><MessageCircle size={15} strokeWidth={1.5} /><span>Repost with thoughts</span></button>
            </div>
          )}
        </div>

        {/* Share */}
        <div className="relative flex-1 flex items-center justify-center" ref={shareOptionsRef}>
          <button
            aria-label="Share"
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="flex items-center justify-center w-full py-3 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition"
          >
            <Share2 size={20} strokeWidth={1.6} />
          </button>
          {showShareOptions && (
            <div className="absolute right-0 bottom-[calc(100%+4px)] min-w-[200px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
              <button onClick={() => { setShowShareOptions(false); window.dispatchEvent(new CustomEvent("open-mini-chat", { detail: { text: "Check out this post: " + `${window.location.origin}/post/${post.id}` } })); showToast("Opening WAC Messages..."); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3 text-[#D4AF37] font-semibold"><MessageCircle size={15} strokeWidth={2} className="text-[#D4AF37]" /><span>Send in WAC Message</span></button>
              <div className="h-px bg-white/5" />
              <button onClick={handleCopyLink} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3"><ExternalLink size={15} strokeWidth={1.5} /><span>Copy Link</span></button>
              <button onClick={handleNativeShare} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3"><Share2 size={15} strokeWidth={1.5} /><span>Share via...</span></button>
            </div>
          )}
        </div>
      </div>

      {/* ── Comments ── */}
      {showComments && <PostComments postId={post.id} />}

      {/* ── Toast ── */}
      {toastMessage && typeof document !== "undefined" && createPortal(
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-2xl border border-white/10 ${toastMessage.type === "error" ? "bg-red-500/90 text-white" : "bg-[#1a1a1a]/95 text-white backdrop-blur-md"}`}>
            {toastMessage.type === "success" && <CheckCircle2 size={15} className="text-[#D4AF37]" strokeWidth={2.5} />}
            {toastMessage.type === "error"   && <X size={15} strokeWidth={2.5} />}
            <span className="text-sm font-semibold whitespace-nowrap">{toastMessage.text}</span>
          </div>
        </div>,
        document.body
      )}

      {/* ── Repost modal ── */}
      {showRepostModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-[var(--border)] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-base font-bold">Repost</h2>
              <button onClick={() => setShowRepostModal(false)} className="p-1.5 opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full transition"><X size={18} /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0 flex items-center justify-center font-bold text-[#D4AF37]">
                  {currentActor?.avatar_url ? <img src={currentActor.avatar_url} alt="" className="w-full h-full object-cover" /> : currentActor?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <textarea placeholder="Add your thoughts..." value={repostThoughts} onChange={(e) => setRepostThoughts(e.target.value)} autoFocus rows={2} className="flex-1 mt-1 bg-transparent border-none outline-none text-base resize-none placeholder:text-white/40 text-white" />
              </div>
              <div className="border border-[var(--border)] rounded-xl p-4 bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-2">
                  {authorAvatar ? <Image src={authorAvatar} alt="" width={18} height={18} className="rounded-full" /> : <div className="w-[18px] h-[18px] rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-[#D4AF37]">{authorName.charAt(0)}</div>}
                  <span className="text-xs font-semibold">{authorName}</span>
                </div>
                {post.content && <p className="text-xs opacity-70 leading-relaxed whitespace-pre-wrap line-clamp-3">{post.content}</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--border)]">
              <button onClick={() => setShowRepostModal(false)} className="px-4 py-2 text-sm opacity-60 hover:opacity-100 transition">Cancel</button>
              <button onClick={handleRepostWithThoughts} disabled={isReacting || !repostThoughts.trim()} className="bg-[#D4AF37] text-black hover:bg-[#F2D06B] px-5 py-2 text-sm font-bold rounded-full transition disabled:opacity-50 flex items-center gap-2">
                {isReacting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Reactions modal ── */}
      {showReactionsModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-[var(--border)] rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-base font-bold">Reactions</h2>
              <button onClick={() => setShowReactionsModal(false)} className="p-1.5 opacity-60 hover:opacity-100 hover:bg-white/10 rounded-full transition"><X size={18} /></button>
            </div>
            <div className="flex flex-col max-h-[60vh] overflow-y-auto p-2">
              {reactionBreakdown.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition">
                  <div className="relative">
                    {r.profile?.avatar_url ? <Image src={r.profile.avatar_url} alt="" width={38} height={38} className="rounded-full border border-white/10" /> : <div className="w-[38px] h-[38px] rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-[#D4AF37]">{r.profile?.full_name?.charAt(0) || "U"}</div>}
                    <div className="absolute -bottom-1 -right-1 bg-[#1a1a1a] rounded-full p-0.5 border border-white/10">
                      <ReactionIcon type={r.reaction_type} size={13} active={false} />
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm truncate">{r.profile?.full_name || "Member"}</span>
                      {r.profile?.is_verified && <CheckCircle2 size={11} className="text-[#D4AF37]" />}
                    </div>
                    <span className="text-xs text-white/45 truncate">{r.profile?.headline || "Member"}</span>
                  </div>
                </div>
              ))}
              {reactionBreakdown.length === 0 && <div className="text-center py-8 text-white/40 text-sm">No reactions yet</div>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
