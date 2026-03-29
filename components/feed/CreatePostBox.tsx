"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useActor } from "@/components/providers/ActorProvider";
import { uploadPostMedia } from "@/lib/services/feedService";
import {
  X, Plus, Loader2, Image as ImageIcon, FileText, CalendarDays,
  HelpCircle, MapPin, ChevronDown, Tag,
} from "lucide-react";
import { ASK_CATEGORIES, ASK_URGENCY_OPTIONS, getCategoryLabel } from "@/lib/constants/askConstants";
import { COMPOSER_INTENTS } from "@/lib/constants/intentConstants";
import MyStoryViewer, { MyStory } from "./MyStoryViewer";

export interface ComposeOverridePayload {
  overrideActorType: "person" | "business" | "organization";
  overrideActorId: string;
  overrideActorName: string;
  overrideActorAvatarUrl?: string | null;
  linkedGroupId?: string;
  linkedGroupName?: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PostType    = "update" | "ask";
type MediaMode   = "idle" | "photo" | "video";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PHOTOS   = 10;
const MAX_FILE_MB  = 50;
const MAX_TEXTAREA = 160;

// ─── Other-user story group (real data only) ─────────────────────────────────

type OtherUserStoryGroup = {
  profileId: string;
  name: string;
  avatarUrl: string | null;
  stories: MyStory[];
};

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
  const [postType,          setPostType]          = useState<PostType>("update");
  const [showMyStoryViewer, setShowMyStoryViewer] = useState(false);
  const [activeStoryGroup,  setActiveStoryGroup]  = useState<OtherUserStoryGroup | null>(null);
  const [myStories,         setMyStories]         = useState<MyStory[]>([]);
  const [overrideActor,     setOverrideActor]     = useState<ComposeOverridePayload | null>(null);
  const [otherStories,      setOtherStories]      = useState<OtherUserStoryGroup[]>([]);

  // Fetch own stories + followed users' stories (real data only)
  useEffect(() => {
    if (!currentActor) return;
    let mounted = true;
    async function fetchStories() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // ── Own stories ───────────────────────────────────────────────────────
      const { data: ownData } = await supabase
        .from("feed_posts")
        .select("*")
        .eq("post_type", "story")
        .eq("submitted_by", user.id)
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: true });

      if (mounted && ownData && ownData.length > 0) {
        const realStories: MyStory[] = ownData.map((post: any) => {
          const mItems = post.media_items || [];
          const storyMeta = mItems.find((m: any) => m.media_type === "story_meta");
          const media = mItems.find((m: any) => m.media_type === "photo" || m.media_type === "video");
          return {
            id: post.id,
            bgGradient: storyMeta?.bgGradient ?? "linear-gradient(135deg, #1a1207 0%, #0c0a08 50%, #121010 100%)",
            cssFilter: storyMeta?.cssFilter ?? "",
            content: post.content || undefined,
            mediaUrl: media?.url || null,
            isVideo: media?.media_type === "video" || false,
            timeAgo: "Recently",
            viewedBy: [],
            mentions: storyMeta?.mentions || [],
            location: storyMeta?.location || undefined,
          };
        });
        if (mounted) setMyStories(realStories);
      }

      // ── Followed users' stories ───────────────────────────────────────────
      const { data: followData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .eq("following_type", "person");

      const followedIds = (followData || []).map((f: any) => f.following_id);
      if (followedIds.length === 0) return;

      const { data: theirStories } = await supabase
        .from("feed_posts")
        .select(`
          *,
          author_profile:profiles!author_profile_id(id, full_name, avatar_url)
        `)
        .eq("post_type", "story")
        .eq("status", "published")
        .in("author_profile_id", followedIds)
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: true });

      if (!mounted || !theirStories || theirStories.length === 0) return;

      // Group by author
      const grouped: Record<string, OtherUserStoryGroup> = {};
      for (const post of theirStories as any[]) {
        const profile = post.author_profile;
        if (!profile) continue;
        if (!grouped[profile.id]) {
          grouped[profile.id] = {
            profileId: profile.id,
            name: profile.full_name || "Member",
            avatarUrl: profile.avatar_url || null,
            stories: [],
          };
        }
        const mItems = post.media_items || [];
        const storyMeta = mItems.find((m: any) => m.media_type === "story_meta");
        const media = mItems.find((m: any) => m.media_type === "photo" || m.media_type === "video");
        grouped[profile.id].stories.push({
          id: post.id,
          bgGradient: storyMeta?.bgGradient ?? "linear-gradient(135deg, #1a1207 0%, #0c0a08 50%, #121010 100%)",
          cssFilter: storyMeta?.cssFilter ?? "",
          content: post.content || undefined,
          mediaUrl: media?.url || null,
          isVideo: media?.media_type === "video" || false,
          timeAgo: "Recently",
          viewedBy: [],
          mentions: storyMeta?.mentions || [],
          location: storyMeta?.location || undefined,
        });
      }
      if (mounted) setOtherStories(Object.values(grouped));
    }
    fetchStories();
    return () => { mounted = false; };
  }, [currentActor]);

  // ── Story seen state (persisted to localStorage)
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("wac_seen_stories");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });

  // ── Post form state
  const [content,       setContent]       = useState("");
  const [mediaMode,     setMediaMode]     = useState<MediaMode>("idle");
  const [photoFiles,    setPhotoFiles]    = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [videoFile,     setVideoFile]     = useState<File | null>(null);
  const [videoPreview,  setVideoPreview]  = useState<string | null>(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [error,         setError]         = useState("");

  // ── Ask composer state
  const [askTitle,    setAskTitle]    = useState("");
  const [askCategory, setAskCategory] = useState("");
  const [askLocation, setAskLocation] = useState("");
  const [askUrgency,  setAskUrgency]  = useState("normal");

  // ── Intent tag (for non-ask posts: announcement, hiring, etc.)
  const [intentTag,            setIntentTag]            = useState<string | null>(null);
  const [showIntentTags,       setShowIntentTags]       = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // ── Group context (when posting into a group)
  const [linkedGroupId, setLinkedGroupId]     = useState<string | null>(null);
  const [linkedGroupName, setLinkedGroupName] = useState<string | null>(null);


  // ── Refs
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

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

  // Listen for open-compose-sheet event from navbar, entity pages, or group pages
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail ?? {};
      setPostType("update");
      if (detail.overrideActorId) {
        setOverrideActor(detail);
      } else {
        setOverrideActor(null);
      }
      if (detail.linkedGroupId) {
        setLinkedGroupId(detail.linkedGroupId);
        setLinkedGroupName(detail.linkedGroupName ?? null);
      } else {
        setLinkedGroupId(null);
        setLinkedGroupName(null);
      }
      setIsSheetOpen(true);
    };
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


  // ── Sheet / form lifecycle ────────────────────────────────────────────────

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    setContent(""); clearAllMedia(); setPostType("update"); setError("");
    setAskTitle(""); setAskCategory(""); setAskLocation(""); setAskUrgency("normal");
    setIntentTag(null); setShowIntentTags(false); setShowCategoryDropdown(false); setOverrideActor(null);
    setLinkedGroupId(null); setLinkedGroupName(null);
  }, [clearAllMedia]);

  const handlePostType = (type: PostType) => {
    setPostType(type);
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
        ...(intentTag ? { post_intent: intentTag } : {}),
        ...(linkedGroupId ? { linked_group_id: linkedGroupId, source_type: "group", source_id: linkedGroupId } : {}),
      };
      // Handle actor attribution
      if (overrideActor) {
        if (overrideActor.overrideActorType === "person")        payload.author_profile_id = overrideActor.overrideActorId;
        else if (overrideActor.overrideActorType === "business") payload.author_business_id = overrideActor.overrideActorId;
        else if (overrideActor.overrideActorType === "organization") payload.author_organization_id = overrideActor.overrideActorId;
      } else {
        if (currentActor?.type === "person")        payload.author_profile_id = currentActor.id;
        else if (currentActor?.type === "business") payload.author_business_id = currentActor.id;
        else if (currentActor?.type === "organization") payload.author_organization_id = currentActor.id;
      }
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

  // ── Ask submit ────────────────────────────────────────────────────────────

  async function handleAskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!askTitle.trim() || !content.trim() || !askCategory) return;
    setIsSubmitting(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload: Record<string, unknown> = {
        submitted_by:          user.id,
        content:               content.trim(),
        post_type:             "general",
        content_type:          "post",
        post_intent:           "ask",
        ask_title:             askTitle.trim(),
        ask_category:          askCategory,
        ask_location:          askLocation.trim() || null,
        ask_urgency:           askUrgency,
        ask_status:            "open",
        status:                "published",
        distribute_to_pulse:   true,
        distribute_to_following: true,
        ...(linkedGroupId ? { linked_group_id: linkedGroupId, source_type: "group", source_id: linkedGroupId } : {}),
      };
      if (overrideActor) {
        if (overrideActor.overrideActorType === "person")           payload.author_profile_id      = overrideActor.overrideActorId;
        else if (overrideActor.overrideActorType === "business")    payload.author_business_id     = overrideActor.overrideActorId;
        else if (overrideActor.overrideActorType === "organization") payload.author_organization_id = overrideActor.overrideActorId;
      } else {
        if (currentActor?.type === "person")           payload.author_profile_id      = currentActor.id;
        else if (currentActor?.type === "business")    payload.author_business_id     = currentActor.id;
        else if (currentActor?.type === "organization") payload.author_organization_id = currentActor.id;
      }
      const { error: e2 } = await supabase.from("feed_posts").insert(payload);
      if (e2) throw e2;
      closeSheet(); onPostCreated?.();
    } catch (err: any) {
      setError(err.message || "Failed to post. Please try again.");
    } finally { setIsSubmitting(false); }
  }

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

  const canSubmit  = postType === "ask"
    ? (!!askTitle.trim() && !!content.trim() && !!askCategory && !isSubmitting)
    : ((!!content.trim() || mediaMode !== "idle") && !isSubmitting);
  const canAddMore = mediaMode === "photo" && photoFiles.length < MAX_PHOTOS;
  const firstName  = currentActor.name.split(" ")[0];

  const sortedStories = [
    ...otherStories.filter(s => !seenIds.has(s.profileId)),
    ...otherStories.filter(s => seenIds.has(s.profileId)),
  ];

  const POST_TYPES: { type: PostType; label: string; icon: React.ReactNode }[] = [
    { type: "update", label: "Update", icon: <FileText   size={18} strokeWidth={1.6} /> },
    { type: "ask",    label: "Ask",    icon: <HelpCircle size={18} strokeWidth={1.6} /> },
  ];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Post media input */}
      <input id="post-media-input" name="post-media-input" ref={mediaInputRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime"
        multiple onChange={handleMediaSelect} className="hidden" />

      {/* ── Stories row ─────────────────────────────────────────────────────── */}
      <div className="pt-2 pb-1">
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

          {/* Other stories — real data only */}
          {sortedStories.map((story) => {
            const isSeen = seenIds.has(story.profileId);
            return (
              <button key={story.profileId} onClick={() => { markSeen(story.profileId); setActiveStoryGroup(story); }}
                className="flex flex-col items-center gap-2 shrink-0 active:scale-95 transition-transform duration-100"
                aria-label={`${story.name}'s story`}
              >
                <StoryCircle name={story.name} avatarUrl={story.avatarUrl} unseen={!isSeen} size={62} />
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
          stories={myStories}
          onClose={() => setShowMyStoryViewer(false)}
          isAuthor={true}
        />
      )}

      {/* ── Other user story viewer ──────────────────────────────────────────── */}
      {activeStoryGroup && (
        <MyStoryViewer
          authorName={activeStoryGroup.name}
          authorAvatar={activeStoryGroup.avatarUrl}
          stories={activeStoryGroup.stories}
          onClose={() => setActiveStoryGroup(null)}
          isAuthor={false}
        />
      )}

      {/* ── Compose sheet ─────────────────────────────────────────────────────── */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={closeSheet} />

          <div
            className="absolute inset-0 md:flex md:items-center md:justify-center md:pointer-events-none"
          >
            <div
              className="w-full h-full md:h-auto md:max-h-[93dvh] md:max-w-lg md:pointer-events-auto bg-[#0f0f0f] md:rounded-2xl md:border border-white/[0.09] shadow-2xl overflow-hidden flex flex-col"
            >

              {/* ── Header ────────────────────────────────────────────────── */}
              <div className="px-5 pt-20 md:pt-4 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-[#b08d57]/[0.08] border border-[#b08d57]/20 flex items-center justify-center font-bold text-[#b08d57] text-sm">
                      {overrideActor ? (
                         overrideActor.overrideActorAvatarUrl 
                           ? <img src={overrideActor.overrideActorAvatarUrl} alt={overrideActor.overrideActorName} className="w-full h-full object-cover" />
                           : overrideActor.overrideActorName.charAt(0).toUpperCase()
                      ) : (
                         currentActor.avatar_url
                           ? <img src={currentActor.avatar_url} alt={currentActor.name} className="w-full h-full object-cover" />
                           : currentActor.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-white leading-none">
                         {overrideActor ? overrideActor.overrideActorName : currentActor.name}
                      </p>
                      <p className="text-[10px] text-white/35 mt-0.5">
                        {linkedGroupName
                           ? `Posting in ${linkedGroupName}`
                           : overrideActor
                           ? `Posting as ${overrideActor.overrideActorType === "person" ? "yourself" : overrideActor.overrideActorType}`
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

              </div>

              {/* ── Post type picker ──────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-0 border-t border-white/[0.07] shrink-0">
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

              {/* ── Create Event — separate action, not an inline compose mode ── */}
              <button
                type="button"
                onClick={() => router.push("/events/create")}
                className="flex items-center justify-between w-full px-5 py-2.5 border-y border-white/[0.06] text-white/38 hover:text-white/60 hover:bg-white/[0.025] transition-all group shrink-0"
              >
                <div className="flex items-center gap-2.5">
                  <CalendarDays size={14} strokeWidth={1.8} />
                  <span className="text-[11px] font-medium">Create an event</span>
                </div>
                <span className="text-[10px] text-white/20 group-hover:text-white/38 transition-colors">Opens event builder →</span>
              </button>

              {/* ── Scrollable body ───────────────────────────────────────── */}
              <div className="overflow-y-auto flex-1">

                {/* ── UPDATE MODE ───────────────────────────────────────────── */}
                {postType !== "ask" && (
                  <form onSubmit={handleSubmit} className="px-5 pb-6 pt-3">
                    <textarea id="post-content-textarea" name="post-content-textarea" ref={textareaRef} value={content} onChange={e => setContent(e.target.value)}
                      placeholder={mediaMode !== "idle" ? "Add a caption…" : `What's on your mind, ${firstName}?`}
                      rows={4} autoFocus disabled={isSubmitting}
                      className="w-full bg-transparent border-b border-white/[0.07] px-0 py-3 text-sm text-white focus:outline-none resize-none placeholder:text-white/22 leading-relaxed"
                      style={{ minHeight: 110 }}
                    />

                    {/* Intent tag selector — collapsed by default */}
                    <div className="mt-3 mb-1">
                      {intentTag ? (
                        // Selected tag — show as compact removable chip
                        (() => {
                          const def = COMPOSER_INTENTS.find(i => i.slug === intentTag);
                          if (!def) return null;
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${def.badgeCls}`}>
                              <def.icon size={9} strokeWidth={2} />
                              {def.label}
                              <button type="button" onClick={() => setIntentTag(null)}
                                className="ml-0.5 opacity-55 hover:opacity-100 transition-opacity">
                                <X size={9} strokeWidth={2.5} />
                              </button>
                            </span>
                          );
                        })()
                      ) : showIntentTags ? (
                        // Expanded chip wall
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {COMPOSER_INTENTS.filter(i => i.slug !== "update" && i.slug !== "ask").map((intent) => (
                            <button key={intent.slug} type="button"
                              onClick={() => { setIntentTag(intent.slug); setShowIntentTags(false); }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border text-white/35 bg-white/[0.03] border-white/[0.08] hover:text-white/55 hover:bg-white/[0.05] transition-all"
                            >
                              <intent.icon size={9} strokeWidth={2} />
                              {intent.label}
                            </button>
                          ))}
                          <button type="button" onClick={() => setShowIntentTags(false)}
                            className="text-[10px] text-white/22 hover:text-white/45 transition-colors ml-1">
                            ✕
                          </button>
                        </div>
                      ) : (
                        // Ghost "Add a tag" trigger
                        <button type="button" onClick={() => setShowIntentTags(true)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border border-white/[0.08] text-white/28 hover:text-white/50 hover:border-white/[0.15] transition-all"
                        >
                          <Tag size={10} strokeWidth={2} />
                          Add a tag
                        </button>
                      )}
                    </div>

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
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${mediaMode !== "idle" ? "text-[#b08d57] bg-[#b08d57]/[0.08]" : "text-white/60 hover:text-white hover:bg-white/[0.05]"}`}>
                        <ImageIcon size={18} strokeWidth={1.8} />
                        <span>Add photo or video</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <button type="button" disabled title="Coming soon"
                          className="text-[13px] font-medium text-white/30 cursor-not-allowed hover:text-white/40 transition">
                          Save draft
                        </button>
                        <button type="button" disabled title="Coming soon"
                          className="text-[13px] font-medium text-white/30 cursor-not-allowed hover:text-white/40 transition">
                          Schedule
                        </button>
                        <button type="submit" disabled={!canSubmit}
                          className="flex items-center gap-2 bg-[#b08d57] text-black hover:bg-[#9a7545] py-2 px-6 rounded-full text-sm font-bold transition disabled:opacity-35 disabled:cursor-not-allowed">
                          {isSubmitting && <Loader2 size={13} className="animate-spin text-[#b08d57]" />}
                          {isSubmitting ? "Posting…" : "Post"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* ── ASK MODE ─────────────────────────────────────────────── */}
                {postType === "ask" && (
                  <form onSubmit={handleAskSubmit} className="px-5 pb-6 pt-4 flex flex-col gap-4">

                    {/* Ask title */}
                    <div>
                      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                        What do you need? <span className="text-rose-400/70">*</span>
                      </label>
                      <input
                        type="text"
                        value={askTitle}
                        onChange={(e) => setAskTitle(e.target.value)}
                        placeholder="e.g. Need a mentor in biotech sales"
                        maxLength={120}
                        disabled={isSubmitting}
                        className="w-full bg-transparent border-b border-white/[0.10] pb-2 text-[15px] font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-[#b08d57]/50 transition-colors"
                      />
                    </div>

                    {/* Ask details */}
                    <div>
                      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                        Details <span className="text-rose-400/70">*</span>
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Describe what you're looking for, who you need, or how the network can help."
                        rows={3}
                        disabled={isSubmitting}
                        className="w-full bg-transparent border-b border-white/[0.07] pb-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#b08d57]/50 transition-colors resize-none leading-relaxed"
                        style={{ minHeight: 72 }}
                      />
                    </div>

                    {/* Category — custom dropdown (no native select) */}
                    <div>
                      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                        Category <span className="text-rose-400/70">*</span>
                      </label>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setShowCategoryDropdown(v => !v)}
                        className="w-full flex items-center justify-between bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors disabled:opacity-50"
                      >
                        <span className={askCategory ? "text-white" : "text-white/30"}>
                          {askCategory ? getCategoryLabel(askCategory) : "Select a category…"}
                        </span>
                        <ChevronDown size={13} strokeWidth={2} className={`text-white/30 transition-transform duration-150 ${showCategoryDropdown ? "rotate-180" : ""}`} />
                      </button>
                      {showCategoryDropdown && (
                        <div className="mt-1 bg-[#1c1c1c] border border-white/[0.10] rounded-xl overflow-hidden" style={{ maxHeight: 220, overflowY: "auto" }}>
                          {ASK_CATEGORIES.map((c) => (
                            <button
                              key={c.slug}
                              type="button"
                              onClick={() => { setAskCategory(c.slug); setShowCategoryDropdown(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-white/[0.05] last:border-b-0 ${
                                askCategory === c.slug
                                  ? "text-[#b08d57] bg-[#b08d57]/[0.07]"
                                  : "text-white/65 hover:bg-white/[0.04] hover:text-white"
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                        Location <span className="text-white/20 normal-case font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <MapPin size={12} strokeWidth={1.8} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                        <input
                          type="text"
                          value={askLocation}
                          onChange={(e) => setAskLocation(e.target.value)}
                          placeholder="e.g. Newark, NJ"
                          maxLength={80}
                          disabled={isSubmitting}
                          className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl pl-7 pr-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#b08d57]/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Urgency — pill buttons (no native select) */}
                    <div>
                      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                        Urgency <span className="text-white/20 normal-case font-normal">(optional)</span>
                      </label>
                      <div className="flex gap-2">
                        {ASK_URGENCY_OPTIONS.map((o) => {
                          const active = askUrgency === o.value;
                          const activeCls =
                            o.value === "urgent" ? "text-rose-400 bg-rose-400/[0.08] border-rose-400/40" :
                            o.value === "soon"   ? "text-amber-400 bg-amber-400/[0.08] border-amber-400/40" :
                                                   "text-[#b08d57] bg-[#b08d57]/[0.08] border-[#b08d57]/40";
                          return (
                            <button
                              key={o.value}
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => setAskUrgency(o.value)}
                              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                active ? activeCls : "text-white/35 bg-white/[0.03] border-white/[0.08] hover:text-white/55 hover:bg-white/[0.05]"
                              }`}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {error && <p className="text-xs text-red-400">{error}</p>}

                    <div className="flex items-center justify-between pt-3 mt-4 border-t border-white/[0.06]">
                      <div className="flex items-center gap-2"></div>
                      <div className="flex items-center gap-3">
                        <button type="button" disabled title="Coming soon"
                          className="text-[13px] font-medium text-white/30 cursor-not-allowed hover:text-white/40 transition">
                          Save draft
                        </button>
                        <button type="button" disabled title="Coming soon"
                          className="text-[13px] font-medium text-white/30 cursor-not-allowed hover:text-white/40 transition">
                          Schedule
                        </button>
                        <button
                          type="submit"
                          disabled={!canSubmit}
                          className="flex items-center gap-2 bg-[#b08d57] text-black hover:bg-[#9a7545] py-2 px-6 rounded-full text-sm font-bold transition disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                          {isSubmitting ? "Posting…" : "Ask the Network"}
                        </button>
                      </div>
                    </div>

                  </form>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
