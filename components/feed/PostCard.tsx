"use client";

import {
  NetworkPost,
  ContentType,
  PostIntent,
  SourceType,
  PostMediaItem,
  PostAuthorProfile,
} from "@/lib/types/network-feed";
import {
  MessageCircle,
  Share2,
  MoreHorizontal,
  Repeat,
  ExternalLink,
  X,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Building2,
  Landmark,
  Users,
  ArrowUpRight,
  Play,
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
  announcement: { label: "Announcement", cls: "text-[#b08d57]/80 bg-[#b08d57]/10 border-[#b08d57]/20" },
  opportunity: { label: "Opportunity", cls: "text-sky-400/80 bg-sky-500/10 border-sky-500/20" },
  job: { label: "Hiring", cls: "text-violet-400/80 bg-violet-500/10 border-violet-500/20" },
  volunteer: { label: "Volunteer", cls: "text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20" },
  fundraiser: { label: "Fundraiser", cls: "text-rose-400/80 bg-rose-500/10 border-rose-500/20" },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds / 31536000 > 1) return Math.floor(seconds / 31536000) + "y";
  if (seconds / 2592000 > 1) return Math.floor(seconds / 2592000) + "mo";
  if (seconds / 86400 > 1) return Math.floor(seconds / 86400) + "d";
  if (seconds / 3600 > 1) return Math.floor(seconds / 3600) + "h";
  if (seconds / 60 > 1) return Math.floor(seconds / 60) + "m";
  return "now";
}

type ReactionBreakdownItem = {
  reaction_type: ReactionType;
  created_at: string;
  profile?: PostAuthorProfile & { id?: string | null };
};

function getDisplayMediaItems(items?: PostMediaItem[], fallbackUrl?: string | null): PostMediaItem[] {
  if (items && items.length > 0) {
    return [...items].sort((a, b) => a.order_index - b.order_index);
  }

  if (fallbackUrl) {
    return [{ url: fallbackUrl, media_type: "photo", order_index: 0 }];
  }

  return [];
}

// ─── Video fullscreen viewer ──────────────────────────────────────────────────
//
// Opens a native-feeling in-app full-screen video experience.
// Rendered as a portal on document.body so it layers above everything.
// Tap outside the video (the dark backdrop) to close.

function VideoFullscreenViewer({ url, onClose }: { url: string; onClose: () => void }) {
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-end p-4 z-10 pointer-events-none">
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 active:bg-white/30 transition pointer-events-auto"
          aria-label="Close video"
        >
          <X size={18} className="text-white" />
        </button>
      </div>

      {/* Video — fills screen, object-contain preserves aspect ratio */}
      <video
        src={url}
        controls
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── PostMediaGallery ─────────────────────────────────────────────────────────

function PostMediaGallery({
  items,
  fallbackUrl,
}: {
  items?: PostMediaItem[];
  fallbackUrl?: string | null;
}) {
  // Full-screen video portal URL — null when closed
  const [fullscreenVideoUrl, setFullscreenVideoUrl] = useState<string | null>(null);

  const displayItems = getDisplayMediaItems(items, fallbackUrl);

  if (displayItems.length === 0) return null;

  // ── Single video ─────────────────────────────────────────────────────────
  if (displayItems.length === 1 && displayItems[0].media_type === "video") {
    const video = displayItems[0];

    return (
      <>
        {/* In-feed thumbnail + play button — tapping opens the fullscreen viewer */}
        <div className="mt-3 rounded-xl overflow-hidden border border-white/[0.07] bg-black">
          <button
            type="button"
            onClick={() => setFullscreenVideoUrl(video.url)}
            className="relative w-full aspect-video flex items-center justify-center bg-black group"
            aria-label="Play video"
          >
            {video.thumbnail_url && (
              <img
                src={video.thumbnail_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="relative z-10 w-[56px] h-[56px] rounded-full bg-black/55 border border-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/75 group-hover:scale-105 group-active:scale-95 transition-all duration-200">
              <Play size={22} fill="white" strokeWidth={0} className="ml-0.5 text-white" />
            </div>
            {/* Tap-to-play label */}
            <span className="absolute bottom-3 left-0 right-0 text-center text-[10px] font-medium text-white/50 tracking-wide select-none">
              Tap to play
            </span>
          </button>
        </div>

        {/* Fullscreen portal — mounts on document.body */}
        {fullscreenVideoUrl && typeof document !== "undefined" && createPortal(
          <VideoFullscreenViewer url={fullscreenVideoUrl} onClose={() => setFullscreenVideoUrl(null)} />,
          document.body
        )}
      </>
    );
  }

  const photos = displayItems.filter((item) => item.media_type === "photo");
  const count = photos.length;
  const maxVisible = 4;
  const visible = photos.slice(0, maxVisible);
  const hidden = count - maxVisible;

  if (count === 0) return null;

  // ── Single photo ─────────────────────────────────────────────────────────
  //
  // Uses 4:5 aspect ratio (portrait) instead of a fixed height so the image
  // fills the phone screen without arbitrary top/bottom cropping.
  // object-cover + object-center centres the subject rather than anchoring top.
  if (count === 1) {
    return (
      <div
        className="mt-3 relative rounded-xl overflow-hidden border border-white/[0.07]"
        style={{ aspectRatio: "4/5" }}
      >
        <a
          href={photos[0].url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 block cursor-zoom-in group"
          aria-label="View full photo"
        >
          <Image
            src={photos[0].url}
            alt="Post photo"
            fill
            className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </a>
      </div>
    );
  }

  // ── 2 photos ──────────────────────────────────────────────────────────────
  if (count === 2) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-white/[0.07]">
        {photos.map((photo, index) => (
          <a
            key={index}
            href={photo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block h-56 cursor-zoom-in group"
          >
            <Image
              src={photo.url}
              alt={`Photo ${index + 1}`}
              fill
              className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, 300px"
            />
          </a>
        ))}
      </div>
    );
  }

  // ── 3 photos ──────────────────────────────────────────────────────────────
  if (count === 3) {
    return (
      <div className="mt-3 flex gap-1 h-[280px] rounded-xl overflow-hidden border border-white/[0.07]">
        <a
          href={photos[0].url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex-1 cursor-zoom-in group"
        >
          <Image
            src={photos[0].url}
            alt="Photo 1"
            fill
            className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, 300px"
          />
        </a>
        <div className="flex flex-col gap-1 flex-1">
          {[photos[1], photos[2]].map((photo, index) => (
            <a
              key={index}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex-1 cursor-zoom-in group"
            >
              <Image
                src={photo.url}
                alt={`Photo ${index + 2}`}
                fill
                className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, 300px"
              />
            </a>
          ))}
        </div>
      </div>
    );
  }

  // ── 4+ photos grid ────────────────────────────────────────────────────────
  return (
    <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-white/[0.07]">
      {visible.map((photo, index) => {
        const isLast = index === maxVisible - 1;
        const hasOverlay = isLast && hidden > 0;

        return (
          <a
            key={index}
            href={hasOverlay ? undefined : photo.url}
            target={hasOverlay ? undefined : "_blank"}
            rel={hasOverlay ? undefined : "noopener noreferrer"}
            className={`relative block h-44 ${hasOverlay ? "cursor-default" : "cursor-zoom-in group"}`}
          >
            <Image
              src={photo.url}
              alt={`Photo ${index + 1}`}
              fill
              className={`object-cover object-center ${!hasOverlay ? "group-hover:scale-[1.02] transition-transform duration-300" : ""}`}
              sizes="(max-width: 640px) 50vw, 300px"
            />
            {hasOverlay && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                <span className="text-white font-semibold text-xl leading-none">+{hidden}</span>
                <span className="text-white/60 text-[10px] font-medium uppercase tracking-widest">more</span>
              </div>
            )}
          </a>
        );
      })}
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

export default function PostCard({ post }: { post: NetworkPost }) {
  const contentType: ContentType = post.content_type ?? "post";
  const postIntent: PostIntent = post.post_intent ?? null;
  const sourceType: SourceType =
    post.source_type ??
    (post.author_organization_id ? "organization" : post.author_business_id ? "business" : "user");

  const isEntityPost = sourceType === "organization" || sourceType === "business";
  const isGroupPost = sourceType === "group";
  const isEvent = contentType === "event";
  const isDiscussion = contentType === "discussion";
  const hasCTA = !!(post.cta_url && post.cta_label);
  const showIntent =
    contentType === "post" &&
    postIntent &&
    postIntent !== "update" &&
    !!INTENT_CONFIG[postIntent];

  const [activeReaction, setActiveReaction] = useState<ReactionType | null>(post.user_reaction_type || null);
  const [reactionCount, setReactionCount] = useState(post.likes_count || 0);
  const [isReacting, setIsReacting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
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
  const [reactionBreakdown, setReactionBreakdown] = useState<ReactionBreakdownItem[]>([]);
  const [uniqueReactionIcons, setUniqueReactionIcons] = useState<ReactionType[]>(
    post.likes_count ? ["like"] : []
  );
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

    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
      if (repostOptionsRef.current && !repostOptionsRef.current.contains(event.target as Node)) {
        setShowRepostOptions(false);
      }
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(event.target as Node)) {
        setShowShareOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showReactionsModal || reactionBreakdown.length > 0) return;

    supabase
      .from("feed_likes")
      .select("reaction_type, created_at, profile:profiles!profile_id(id, full_name, avatar_url, headline, is_verified)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data || data.length === 0) return;

        const typedData = data as ReactionBreakdownItem[];
        setReactionBreakdown(typedData);

        const types = Array.from(new Set(typedData.map((item) => item.reaction_type))).slice(0, 3) as ReactionType[];
        setUniqueReactionIcons(types);
      });
  }, [showReactionsModal, reactionBreakdown.length, post.id]);

  // ─── Author resolution ─────────────────────────────────────────────────────

  let authorName = "Unknown";
  let authorAvatar: string | null = null;
  let authorHeadline = "";
  let authorLink = "#";
  let isVerified = false;

  if (post.author_profile) {
    authorName = post.author_profile.full_name || "Member";
    authorAvatar = post.author_profile.avatar_url;
    authorHeadline = post.author_profile.headline || "Member";
    authorLink = post.author_profile.username ? `/people/${post.author_profile.username}` : "#";
    isVerified = post.author_profile.is_verified;
  } else if (post.author_business) {
    authorName = post.author_business.name;
    authorAvatar = post.author_business.logo_url;
    authorHeadline = post.author_business.business_type || "Business";
    authorLink = `/businesses/${post.author_business.slug}`;
    isVerified = post.author_business.is_verified;
  } else if (post.author_organization) {
    authorName = post.author_organization.name;
    authorAvatar = post.author_organization.logo_url;
    authorHeadline = post.author_organization.organization_type || "Organization";
    authorLink = `/organizations/${post.author_organization.slug}`;
    isVerified = post.author_organization.is_verified;
  }

  const actorOwnsPost =
    (currentActor?.type === "person" && !!post.author_profile_id && currentActor.id === post.author_profile_id) ||
    (currentActor?.type === "business" && !!post.author_business_id && currentActor.id === post.author_business_id) ||
    (currentActor?.type === "organization" &&
      !!post.author_organization_id &&
      currentActor.id === post.author_organization_id);

  const isOwner = actorOwnsPost || (!currentActor && currentUserId === post.author_profile_id);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleReaction = async (type: ReactionType) => {
    if (isReacting) return;

    setIsReacting(true);
    setShowReactions(false);

    const previousReaction = activeReaction;

    const updateBreakdown = (newType: ReactionType | null) => {
      setReactionBreakdown((prev) => {
        const next = [...prev];
        const existingIndex = next.findIndex((item) => item.profile?.id === currentUserId);

        if (newType === null) {
          if (existingIndex >= 0) next.splice(existingIndex, 1);
        } else {
          if (existingIndex >= 0) {
            next[existingIndex] = { ...next[existingIndex], reaction_type: newType };
          } else {
            next.unshift({
              reaction_type: newType,
              created_at: new Date().toISOString(),
              profile: {
                id: currentUserId,
                full_name: currentActor?.name || "You",
                avatar_url: currentActor?.avatar_url || null,
                headline:
                  currentActor?.type === "business"
                    ? "Business"
                    : currentActor?.type === "organization"
                      ? "Organization"
                      : "Member",
                is_verified: false,
                username: null,
              },
            });
          }
        }

        setUniqueReactionIcons(Array.from(new Set(next.map((item) => item.reaction_type))).slice(0, 3) as ReactionType[]);
        return next;
      });
    };

    if (activeReaction === type) {
      setActiveReaction(null);
      setReactionCount((prev) => prev - 1);
      updateBreakdown(null);
    } else {
      if (!activeReaction) setReactionCount((prev) => prev + 1);
      setActiveReaction(type);
      updateBreakdown(type);
    }

    try {
      const { success } = await togglePostReaction(post.id, type);

      if (!success) {
        setActiveReaction(previousReaction);
        updateBreakdown(previousReaction);

        if (activeReaction === type) setReactionCount((prev) => prev + 1);
        else if (!previousReaction) setReactionCount((prev) => prev - 1);
      }
    } catch {
      setActiveReaction(previousReaction);
      updateBreakdown(previousReaction);

      if (activeReaction === type) setReactionCount((prev) => prev + 1);
      else if (!previousReaction) setReactionCount((prev) => prev - 1);
    } finally {
      setIsReacting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;

    setIsDeleting(true);
    const { success } = await deletePost(post.id);

    if (success) {
      window.location.reload();
    } else {
      setIsDeleting(false);
      showToast("Failed to delete post", "error");
    }
  };

  const handleEditSubmit = async () => {
    if (!editContent.trim()) return;

    setIsEditSubmitting(true);
    const { success } = await editPost(post.id, editContent);
    setIsEditSubmitting(false);

    if (success) {
      setIsEditing(false);
      post.content = editContent;
    } else {
      showToast("Failed to update post", "error");
    }
  };

  const handleRepost = async () => {
    setShowRepostOptions(false);
    setIsReacting(true);

    try {
      const targetId = post.original_post ? post.original_post.id : post.id;

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user?.id) {
        throw new Error("Authentication required.");
      }

      const actorJson =
        typeof window !== "undefined" ? localStorage.getItem("wac_active_actor") : null;

      let insertPayload: Record<string, unknown> = {
        submitted_by: session.user.id,
        content: "",
        post_type: "general",
        content_type: "post",
        original_post_id: targetId,
      };

      if (actorJson) {
        try {
          const actor = JSON.parse(actorJson) as { id: string; type: "person" | "business" | "organization" };
          if (actor.type === "business") insertPayload.author_business_id = actor.id;
          else if (actor.type === "organization") insertPayload.author_organization_id = actor.id;
          else insertPayload.author_profile_id = actor.id;
        } catch {
          insertPayload.author_profile_id = session.user.id;
        }
      } else {
        insertPayload.author_profile_id = session.user.id;
      }

      const { error } = await supabase.from("feed_posts").insert(insertPayload);
      if (error) throw error;

      showToast("Successfully reposted");
    } catch (error: any) {
      showToast("Failed to repost: " + error.message, "error");
    } finally {
      setIsReacting(false);
    }
  };

  const handleRepostWithThoughts = () => {
    if (!repostThoughts.trim()) return;

    setIsReacting(true);

    const targetId = post.original_post ? post.original_post.id : post.id;

    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      try {
        if (sessionError || !data.session?.user?.id) {
          throw new Error("Authentication required.");
        }

        const actorJson =
          typeof window !== "undefined" ? localStorage.getItem("wac_active_actor") : null;

        const insertPayload: Record<string, unknown> = {
          submitted_by: data.session.user.id,
          content: repostThoughts,
          post_type: "general",
          content_type: "post",
          original_post_id: targetId,
        };

        if (actorJson) {
          try {
            const actor = JSON.parse(actorJson) as { id: string; type: "person" | "business" | "organization" };
            if (actor.type === "business") insertPayload.author_business_id = actor.id;
            else if (actor.type === "organization") insertPayload.author_organization_id = actor.id;
            else insertPayload.author_profile_id = actor.id;
          } catch {
            insertPayload.author_profile_id = data.session.user.id;
          }
        } else {
          insertPayload.author_profile_id = data.session.user.id;
        }

        const { error } = await supabase.from("feed_posts").insert(insertPayload);

        setIsReacting(false);
        setShowRepostModal(false);
        setRepostThoughts("");

        if (error) {
          showToast("Failed to repost: " + error.message, "error");
        } else {
          showToast("Successfully reposted");
        }
      } catch (error: any) {
        setIsReacting(false);
        showToast("Failed to repost: " + error.message, "error");
      }
    });
  };

  const handleCopyLink = () => {
    setShowShareOptions(false);
    navigator.clipboard
      .writeText(`${window.location.origin}/post/${post.id}`)
      .then(() => showToast("Link copied!"));
  };

  const handleNativeShare = async () => {
    setShowShareOptions(false);

    const url = `${window.location.origin}/post/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${authorName} on WAC`,
          text: post.content?.substring(0, 100) || "",
          url,
        });
      } catch {
        // user canceled
      }
    } else {
      handleCopyLink();
    }
  };

  if (isDeleting) return null;

  const cardBorder = isEntityPost
    ? "border border-[var(--accent)]/20 hover:border-[var(--accent)]/40"
    : "hover:border-[var(--accent)]/30";

  const originalPreviewItems = getDisplayMediaItems(
    post.original_post?.media_items,
    post.original_post?.image_url
  );

  return (
    <div className={`wac-card p-5 mb-4 transition-colors relative ${cardBorder}`}>
      {post.original_post_id && (
        <div className="flex items-center gap-2 text-[11px] font-semibold text-white/40 mb-3 pb-3 border-b border-white/5">
          <Repeat size={13} strokeWidth={2} className="text-[#b08d57]/60" />
          <span>{authorName} reposted</span>
        </div>
      )}

      {(isEvent || isDiscussion || isGroupPost) && (
        <div
          className={`flex items-center gap-1.5 mb-3 pb-3 border-b text-[11px] font-semibold ${isEvent ? "text-[#b08d57]/70 border-[#b08d57]/10" : "text-white/35 border-white/[0.06]"
            }`}
        >
          {isEvent && <Calendar size={11} />}
          {isDiscussion && !isGroupPost && <MessageSquare size={11} />}
          {isGroupPost && <Users size={11} />}
          <span>{isEvent ? "Event" : isGroupPost ? "Group Discussion" : "Discussion"}</span>
          {isEvent && hasCTA && <span className="ml-auto text-[10px] text-white/25 font-normal">CTA below ↓</span>}
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <Link href={authorLink} className="flex items-center gap-3 group min-w-0">
          <div
            className={`relative shrink-0 overflow-hidden bg-white/5 border border-[var(--border)] group-hover:border-[var(--accent)]/50 transition-colors ${isEntityPost ? "w-11 h-11 rounded-xl" : "w-11 h-11 rounded-full"
              }`}
          >
            {authorAvatar ? (
              <Image src={authorAvatar} alt={authorName} fill sizes="40px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[#b08d57] text-sm">
                {authorName.charAt(0)}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-[0.9rem] leading-tight group-hover:text-[var(--accent)] transition-colors truncate">
                {authorName}
              </h3>
              {isVerified && (
                <svg className="w-3.5 h-3.5 shrink-0 text-[#b08d57]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.081.9C11.239.199 12.761.199 13.919.9l1.455.882c.49.297 1.05.438 1.611.408l1.7-.091c1.353-.072 2.553.844 2.89 2.158l.423 1.64c.143.553.438 1.05.85 1.45L24 8.527c.974.945.974 2.505 0 3.45l-1.152 1.118c-.412.4-.707.897-.85 1.45l-.423 1.64c-.337 1.314-1.537 2.23-2.89 2.158l-1.7-.091c-.56-.03-1.121.111-1.611.408l-1.455.882c-1.158.701-2.68.701-3.838 0l-1.455-.882c-.49-.297-1.05-.438-1.611-.408l-1.7.091c-1.353.072-2.553-.844-2.89-2.158l-.423-1.64c-.143-.553-.438-1.05-.85-1.45L0 11.977c-.974-.945-.974-2.505 0-3.45l1.152-1.118c.412-.4.707-.897.85-1.45l.423-1.64c.337-1.314 1.537-2.23 2.89-2.158l1.7.091c.56.03 1.121-.111 1.611-.408L10.081.9z" />
                </svg>
              )}
              {isEntityPost && (
                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${sourceType === "organization"
                      ? "bg-[#b08d57]/8 text-[#b08d57]/55 border-[#b08d57]/15"
                      : "bg-white/[0.06] text-white/40 border-white/10"
                    }`}
                >
                  {sourceType === "organization" ? (
                    <>
                      <Landmark size={8} />
                      Official
                    </>
                  ) : (
                    <>
                      <Building2 size={8} />
                      Business
                    </>
                  )}
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
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition"
                >
                  Edit
                </button>
                <div className="h-px bg-white/5" />
                <button
                  onClick={() => {
                    handleDelete();
                    setShowOptions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showIntent && (
        <div className="mb-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${INTENT_CONFIG[postIntent!].cls}`}
          >
            {INTENT_CONFIG[postIntent!].label}
          </span>
        </div>
      )}

      <div className="mb-4">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-black/20 border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] min-h-[100px]"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-white/50 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={isEditSubmitting}
                className="px-4 py-1.5 text-xs bg-[#b08d57] text-black font-bold rounded-lg hover:bg-[#9a7545] transition"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          post.content && (
            <p
              className={`leading-relaxed whitespace-pre-wrap ${isDiscussion ? "text-[0.9rem] opacity-90" : "text-sm opacity-90"
                }`}
            >
              {post.content}
            </p>
          )
        )}

        <PostMediaGallery items={post.media_items} fallbackUrl={post.image_url} />

        {post.original_post && (
          <div className="mt-4 border border-[var(--border)] rounded-xl p-4 bg-white/[0.025]">
            <div className="flex items-center gap-2 mb-2">
              {post.original_post.author_profile?.avatar_url ? (
                <Image
                  src={post.original_post.author_profile.avatar_url}
                  alt=""
                  width={22}
                  height={22}
                  className="rounded-full"
                />
              ) : (
                <div className="w-[22px] h-[22px] rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-[#b08d57]">
                  {post.original_post.author_profile?.full_name?.charAt(0) || "U"}
                </div>
              )}
              <span className="text-xs font-semibold truncate">
                {post.original_post.author_profile?.full_name || "Member"}
              </span>
              <span className="text-[11px] text-white/40 ml-auto shrink-0">
                {timeAgo(post.original_post.created_at)}
              </span>
            </div>

            <p className="text-sm opacity-80 leading-relaxed whitespace-pre-wrap line-clamp-4">
              {post.original_post.content}
            </p>

            {originalPreviewItems.length > 0 && (
              <div className="mt-3">
                <PostMediaGallery
                  items={post.original_post.media_items}
                  fallbackUrl={post.original_post.image_url}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {hasCTA && !isEditing && (
        <a
          href={post.cta_url!}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm transition-all mb-4 ${isEvent
              ? "bg-[var(--accent)] text-black hover:bg-[#F3E5AB] shadow-md shadow-[var(--accent)]/15"
              : "bg-white/[0.05] text-white/80 hover:bg-white/[0.09] border border-white/10"
            }`}
        >
          <span>{post.cta_label}</span>
          <ArrowUpRight size={14} strokeWidth={2.5} />
        </a>
      )}

      {(reactionCount > 0 || post.comments_count > 0 || (post.repost_count ?? 0) > 0) && (
        <div className="flex justify-between items-center text-[11px] text-white/45 pb-3 px-1">
          <div
            className="flex items-center gap-1.5 hover:text-[var(--accent)] cursor-pointer transition-colors"
            onClick={() => setShowReactionsModal(true)}
          >
            {reactionCount > 0 && (
              <>
                <div className="flex -space-x-1">
                  {uniqueReactionIcons.map((type, index) => (
                    <ReactionIcon
                      key={type || index}
                      type={type || "like"}
                      size={13}
                      active={false}
                      className="relative bg-[#1a1a1a] rounded-full"
                    />
                  ))}
                </div>
                <span className="font-medium ml-0.5">{reactionCount.toLocaleString()}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {post.comments_count > 0 && (
              <span
                className="hover:text-[var(--accent)] cursor-pointer transition-colors"
                onClick={() => setShowComments(!showComments)}
              >
                {post.comments_count.toLocaleString()}{" "}
                {post.comments_count === 1 ? "comment" : "comments"}
              </span>
            )}

            {post.comments_count > 0 && (post.repost_count ?? 0) > 0 && <span>·</span>}

            {(post.repost_count ?? 0) > 0 && (
              <span>
                {post.repost_count!.toLocaleString()}{" "}
                {post.repost_count === 1 ? "repost" : "reposts"}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-stretch border-t border-white/[0.06] -mx-5 px-2 relative">
        <div
          className="relative flex-1 flex items-center justify-center"
          onMouseEnter={() => setShowReactions(true)}
          onMouseLeave={() => setShowReactions(false)}
        >
          <button
            aria-label={activeReaction ? `Remove ${activeReaction} reaction` : "React to post"}
            onTouchStart={() => {
              isLongPress.current = false;
              pressTimer.current = setTimeout(() => {
                isLongPress.current = true;
                setShowReactions(true);
              }, 400);
            }}
            onTouchEnd={() => {
              if (pressTimer.current) clearTimeout(pressTimer.current);
            }}
            onTouchMove={() => {
              if (pressTimer.current) clearTimeout(pressTimer.current);
            }}
            onContextMenu={(event) => {
              if (isLongPress.current) event.preventDefault();
            }}
            onClick={(event) => {
              if (isLongPress.current) {
                event.preventDefault();
                return;
              }
              handleReaction(activeReaction || "like");
            }}
            disabled={isReacting}
            className={`group flex items-center justify-center w-full py-3 rounded-xl transition select-none ${activeReaction
                ? "text-[#b08d57]"
                : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
              }`}
          >
            <ReactionIcon
              type={activeReaction || "like"}
              size={20}
              active={!!activeReaction}
              animateOnClick={false}
              className={
                activeReaction
                  ? "drop-shadow-[0_0_8px_rgba(176,141,87,0.6)]"
                  : "group-hover:scale-110 transition-transform"
              }
            />
          </button>

          {showReactions && (
            <div className="absolute bottom-full left-0 pb-2 z-50 w-max">
              <div
                className="bg-[#1a1a1a] border border-white/10 rounded-full px-3 py-2 flex gap-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200"
                onClick={() => setShowReactions(false)}
              >
                {SUPPORTED_REACTIONS.map(({ type }) => (
                  <button
                    key={type}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleReaction(type);
                    }}
                    className="p-1"
                    aria-label={type}
                  >
                    <ReactionIcon
                      type={type}
                      size={28}
                      active={activeReaction === type}
                      showTooltip={false}
                      className="hover:-translate-y-2 hover:scale-110"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center">
          <button
            aria-label={isDiscussion ? "Reply" : "Comment"}
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center justify-center w-full py-3 rounded-xl transition ${showComments
                ? "text-[#b08d57]"
                : isDiscussion
                  ? "text-white/55 hover:text-white/80 hover:bg-white/[0.04]"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
              }`}
          >
            <MessageCircle
              size={20}
              strokeWidth={showComments ? 2.2 : 1.6}
              className={showComments ? "drop-shadow-[0_0_8px_rgba(176,141,87,0.5)]" : ""}
            />
          </button>
        </div>

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
              <button
                onClick={handleRepost}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3"
              >
                <Repeat size={15} strokeWidth={1.5} />
                <span>Repost</span>
              </button>
              <div className="h-px bg-white/5" />
              <button
                onClick={() => {
                  setShowRepostOptions(false);
                  setShowRepostModal(true);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3"
              >
                <MessageCircle size={15} strokeWidth={1.5} />
                <span>Repost with thoughts</span>
              </button>
            </div>
          )}
        </div>

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
              <button
                onClick={() => {
                  setShowShareOptions(false);
                  window.dispatchEvent(
                    new CustomEvent("open-mini-chat", {
                      detail: { text: "Check out this post: " + `${window.location.origin}/post/${post.id}` },
                    })
                  );
                  showToast("Opening WAC Messages...");
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3 text-[#b08d57] font-semibold"
              >
                <MessageCircle size={15} strokeWidth={2} className="text-[#b08d57]" />
                <span>Send in WAC Message</span>
              </button>
              <div className="h-px bg-white/5" />
              <button
                onClick={handleCopyLink}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3"
              >
                <ExternalLink size={15} strokeWidth={1.5} />
                <span>Copy Link</span>
              </button>
              <button
                onClick={handleNativeShare}
                className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition flex items-center gap-3"
              >
                <Share2 size={15} strokeWidth={1.5} />
                <span>Share via…</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showComments && <PostComments postId={post.id} />}

      {toastMessage &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] pointer-events-none animate-in slide-in-from-top-5 fade-in duration-300">
            <div
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full shadow-2xl border border-white/10 ${toastMessage.type === "error"
                  ? "bg-red-500/90 text-white"
                  : "bg-[#1a1a1a]/95 text-white backdrop-blur-md"
                }`}
            >
              {toastMessage.type === "success" && (
                <CheckCircle2 size={15} className="text-[#b08d57]" strokeWidth={2.5} />
              )}
              {toastMessage.type === "error" && <X size={15} strokeWidth={2.5} />}
              <span className="text-sm font-semibold whitespace-nowrap">{toastMessage.text}</span>
            </div>
          </div>,
          document.body
        )}

      {showRepostModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRepostModal(false)} />
            <div className="relative w-full max-w-lg bg-[#111] rounded-t-2xl md:rounded-2xl border border-white/10 shadow-2xl p-5 z-10">
              <h3 className="text-sm font-semibold text-white mb-3">Repost with thoughts</h3>
              <textarea
                value={repostThoughts}
                onChange={(e) => setRepostThoughts(e.target.value)}
                placeholder="What do you think about this?"
                className="w-full h-24 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#b08d57]/40 resize-none"
              />
              <div className="flex gap-3 mt-3 justify-end">
                <button
                  onClick={() => { setShowRepostModal(false); setRepostThoughts(""); }}
                  className="px-4 py-2 text-sm text-white/50 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRepostWithThoughts}
                  disabled={!repostThoughts.trim() || isReacting}
                  className="px-5 py-2 bg-[#b08d57] text-black text-sm font-bold rounded-full hover:bg-[#9a7545] transition disabled:opacity-40"
                >
                  Repost
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {showReactionsModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowReactionsModal(false)} />
            <div className="relative w-full max-w-md bg-[#111] rounded-t-2xl md:rounded-2xl border border-white/10 shadow-2xl z-10 max-h-[60vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
                <h3 className="text-sm font-semibold text-white">Reactions</h3>
                <button
                  onClick={() => setShowReactionsModal(false)}
                  className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition"
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {reactionBreakdown.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-white/30">No reactions yet.</div>
                ) : (
                  reactionBreakdown.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04]">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-white/[0.06] shrink-0">
                        {item.profile?.avatar_url
                          ? <img src={item.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-[#b08d57]">
                              {item.profile?.full_name?.charAt(0) || "?"}
                            </div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">{item.profile?.full_name || "Member"}</p>
                        {item.profile?.headline && (
                          <p className="text-[10px] text-white/35 truncate">{item.profile.headline}</p>
                        )}
                      </div>
                      <ReactionIcon type={item.reaction_type} size={18} active className="shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
