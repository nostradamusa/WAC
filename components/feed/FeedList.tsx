"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { NetworkPost, PostMediaItem } from "@/lib/types/network-feed";
import { Activity, Users, ChevronDown, Check, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import PostCard from "./PostCard";
import AskCard from "./AskCard";
import CreatePostBox from "./CreatePostBox";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Post normalization ────────────────────────────────────────────────────────

function normalizeMediaItems(raw: unknown): PostMediaItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is PostMediaItem =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as any).url === "string" &&
      ((item as any).media_type === "photo" || (item as any).media_type === "video"),
  );
}

function normalizePost(raw: any): NetworkPost {
  return {
    ...raw,
    content:        raw.content        ?? "",
    likes_count:    raw.likes_count    ?? 0,
    comments_count: raw.comments_count ?? 0,
    repost_count:   raw.repost_count   ?? 0,
    image_url:      raw.image_url      ?? null,
    media_items:    normalizeMediaItems(raw.media_items),
    // Ask fields
    post_intent:          raw.post_intent          ?? null,
    ask_title:            raw.ask_title            ?? null,
    ask_category:         raw.ask_category         ?? null,
    ask_location:         raw.ask_location         ?? null,
    ask_status:           raw.ask_status           ?? null,
    ask_urgency:          raw.ask_urgency          ?? null,
    ask_best_response_id: raw.ask_best_response_id ?? null,
    original_post:
      raw.original_post && typeof raw.original_post === "object" && raw.original_post.id
        ? {
            ...raw.original_post,
            content:     raw.original_post.content     ?? "",
            image_url:   raw.original_post.image_url   ?? null,
            media_items: normalizeMediaItems(raw.original_post.media_items),
          }
        : null,
  };
}

// ─── Follow state batch hydration ─────────────────────────────────────────────

type FollowSet = Set<string>; // "person:uuid" | "business:uuid" | "organization:uuid"

async function fetchFollowSet(userId: string): Promise<FollowSet> {
  const { data } = await supabase
    .from("follows")
    .select("following_type, following_id")
    .eq("follower_id", userId);

  if (!data) return new Set();
  return new Set(data.map((f: any) => `${f.following_type}:${f.following_id}`));
}

function isAuthorFollowed(post: NetworkPost, followSet: FollowSet): boolean {
  if (post.author_profile_id)      return followSet.has(`person:${post.author_profile_id}`);
  if (post.author_business_id)     return followSet.has(`business:${post.author_business_id}`);
  if (post.author_organization_id) return followSet.has(`organization:${post.author_organization_id}`);
  return false;
}

// ─── Feed query ────────────────────────────────────────────────────────────────

const BASE_SELECT = `
  *,
  author_profile:profiles!author_profile_id(full_name, username, headline, avatar_url, is_verified),
  author_business:businesses!author_business_id(name, slug, business_type, logo_url, is_verified),
  author_organization:organizations!author_organization_id(name, slug, organization_type, logo_url, is_verified),
  original_post:feed_posts!original_post_id(
    *,
    author_profile:profiles!author_profile_id(full_name, username, headline, avatar_url, is_verified),
    author_business:businesses!author_business_id(name, slug, business_type, logo_url, is_verified),
    author_organization:organizations!author_organization_id(name, slug, organization_type, logo_url, is_verified)
  )
`;

async function fetchFeed(
  tab: "foryou" | "following",
  sortOpt: "top" | "recent",
  userId: string | null,
  offset: number,
): Promise<{ posts: NetworkPost[]; hasMore: boolean }> {

  let query = supabase
    .from("feed_posts")
    .select(BASE_SELECT)
    .eq("status", "published")
    .neq("post_type", "story");

  if (tab === "following") {
    if (!userId) {
      // Not logged in — show nothing in Following
      return { posts: [], hasMore: false };
    }

    // Fetch who this user follows directly from the follows table
    const { data: followData } = await supabase
      .from("follows")
      .select("following_type, following_id")
      .eq("follower_id", userId);

    if (!followData || followData.length === 0) {
      return { posts: [], hasMore: false };
    }

    const profileIds = followData
      .filter((f: any) => f.following_type === "person")
      .map((f: any) => f.following_id);
    const businessIds = followData
      .filter((f: any) => f.following_type === "business")
      .map((f: any) => f.following_id);
    const orgIds = followData
      .filter((f: any) => f.following_type === "organization")
      .map((f: any) => f.following_id);

    // Build OR filter across the three author columns
    const conditions: string[] = [];
    if (profileIds.length > 0)  conditions.push(`author_profile_id.in.(${profileIds.join(",")})`);
    if (businessIds.length > 0) conditions.push(`author_business_id.in.(${businessIds.join(",")})`);
    if (orgIds.length > 0)      conditions.push(`author_organization_id.in.(${orgIds.join(",")})`);

    if (conditions.length === 0) return { posts: [], hasMore: false };

    query = query.or(conditions.join(","));

  } else {
    // For You — published posts distributed to pulse
    query = query.eq("distribute_to_pulse", true);
  }

  if (sortOpt === "top") {
    query = query
      .order("likes_count", { ascending: false })
      .order("created_at",  { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Fetch one extra to detect whether more pages exist
  const { data, error } = await query.range(offset, offset + PAGE_SIZE);
  if (error) throw new Error(error.message || JSON.stringify(error));

  const raw: any[] = data || [];
  const hasMore = raw.length > PAGE_SIZE;
  const page = raw.slice(0, PAGE_SIZE);

  // Hydrate user reactions
  if (page.length > 0 && userId) {
    const postIds = page.map((p) => p.id);
    const { data: myReactions } = await supabase
      .from("feed_likes")
      .select("post_id, reaction_type")
      .in("post_id", postIds)
      .eq("profile_id", userId);

    if (myReactions && myReactions.length > 0) {
      const reactionMap = myReactions.reduce<Record<string, string>>((acc, curr: any) => {
        acc[curr.post_id] = curr.reaction_type;
        return acc;
      }, {});
      return {
        posts: page.map((p) => normalizePost({ ...p, user_reaction_type: reactionMap[p.id] ?? null })),
        hasMore,
      };
    }
  }

  return { posts: page.map(normalizePost), hasMore };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeedList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [posts, setPosts]                     = useState<NetworkPost[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [isLoadingMore, setIsLoadingMore]     = useState(false);
  const [errorLine, setErrorLine]             = useState<string | null>(null);
  const [activeTab, setActiveTab]             = useState<"foryou" | "following">("foryou");
  const [sortBy, setSortBy]                   = useState<"top" | "recent">("top");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [internalRefresh, setInternalRefresh] = useState(0);
  const [postLive, setPostLive]               = useState(false);
  const [hasMore, setHasMore]                 = useState(false);
  const [offset, setOffset]                   = useState(0);
  const [followSet, setFollowSet]             = useState<FollowSet>(new Set());
  const [userId, setUserId]                   = useState<string | null>(null);

  const postLiveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortRef       = useRef<HTMLDivElement>(null);

  // ── Initial auth + follow state load ──────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        const set = await fetchFollowSet(uid);
        setFollowSet(set);
      }
    });
  }, []);

  const load = useCallback(async (
    tab: "foryou" | "following",
    sort: "top" | "recent",
    uid: string | null,
    currentOffset: number,
    append: boolean,
  ) => {
    if (append) setIsLoadingMore(true);
    else { setIsLoading(true); setErrorLine(null); }

    try {
      const result = await fetchFeed(tab, sort, uid, currentOffset);
      setPosts((prev) => append ? [...prev, ...result.posts] : result.posts);
      setHasMore(result.hasMore);
      setOffset(currentOffset + result.posts.length);
    } catch (err: any) {
      console.error("FeedList fetch error:", err);
      if (!append) setErrorLine(err.message || "Failed to load feed.");
    } finally {
      if (append) setIsLoadingMore(false);
      else setIsLoading(false);
    }
  }, []);

  // Full reload whenever tab/sort/refresh changes
  useEffect(() => {
    load(activeTab, sortBy, userId, 0, false);
  }, [load, refreshTrigger, internalRefresh, activeTab, sortBy, userId]);

  // ── Load more ─────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    load(activeTab, sortBy, userId, offset, true);
  }, [isLoadingMore, hasMore, load, activeTab, sortBy, userId, offset]);

  // ── Also refresh follow set when user follows/unfollows (via PostCard) ────
  const refreshFollowSet = useCallback(async () => {
    if (!userId) return;
    const set = await fetchFollowSet(userId);
    setFollowSet(set);
  }, [userId]);

  // ── Click outside sort dropdown ───────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (postLiveTimer.current) clearTimeout(postLiveTimer.current);
    };
  }, []);

  // ── Refresh event from CreatePostBox ──────────────────────────────────────
  useEffect(() => {
    const handleRefresh = () => setInternalRefresh((n) => n + 1);
    window.addEventListener("wac-refresh-feed", handleRefresh);
    return () => window.removeEventListener("wac-refresh-feed", handleRefresh);
  }, []);

  const handlePostCreated = useCallback(() => {
    setSortBy("recent");
    setInternalRefresh((n) => n + 1);
    setPostLive(true);
    if (postLiveTimer.current) clearTimeout(postLiveTimer.current);
    postLiveTimer.current = setTimeout(() => setPostLive(false), 4000);
  }, []);

  const forYouActive    = activeTab === "foryou";
  const followingActive = activeTab === "following";

  return (
    <div>

      {/* ── Composer + stories row ── */}
      <CreatePostBox onPostCreated={handlePostCreated} />

      {/* ── Feed Tab Bar ── */}
      <div className="relative z-10 bg-[var(--background)]">
        <div className="border-b border-white/[0.08] py-2 mb-3 flex items-center justify-between gap-3">

          <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.05] border border-white/[0.09] rounded-full">
            <button
              onClick={() => setActiveTab("foryou")}
              title="Posts from across the network"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                forYouActive
                  ? "bg-white/[0.12] text-white"
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              <Activity size={11} strokeWidth={forYouActive ? 2.2 : 1.8} className="shrink-0" />
              For You
            </button>
            <button
              onClick={() => setActiveTab("following")}
              title="Posts from people and entities you follow"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                followingActive
                  ? "bg-white/[0.12] text-white"
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              <Users size={11} strokeWidth={followingActive ? 2.2 : 1.8} className="shrink-0" />
              Following
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tab descriptor — small hint */}
            <span className="hidden sm:block text-[10px] text-white/32 leading-none">
              {forYouActive ? "Posts from across the network" : "Posts from people & entities you follow"}
            </span>

            <div ref={sortRef} className="relative">
              <button
                onClick={() => setShowSortOptions((v) => !v)}
                aria-label="Sort feed"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors ${
                  showSortOptions
                    ? "border-[#b08d57]/30 bg-[#b08d57]/[0.08] text-[#b08d57]/80"
                    : "border-white/[0.10] text-white/40 hover:text-white/60 hover:border-white/[0.15]"
                }`}
              >
                <span>{sortBy === "top" ? "Top" : "Recent"}</span>
                <ChevronDown
                  size={10}
                  strokeWidth={2}
                  style={{ transform: showSortOptions ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
                />
              </button>

              {showSortOptions && (
                <div className="absolute right-0 top-full mt-1.5 w-28 bg-[#111] border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden z-20">
                  {(["top", "recent"] as const).map((opt) => {
                    const selected = sortBy === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => { setSortBy(opt); setShowSortOptions(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors ${
                          selected
                            ? "text-[#b08d57] bg-[#b08d57]/[0.06] font-semibold"
                            : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                        }`}
                      >
                        {opt === "top" ? "Top" : "Recent"}
                        {selected && <Check size={11} strokeWidth={2.5} className="shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Mobile-only tab context line — hidden sm:hidden on ≥sm where the inline hint is visible */}
        <p className="sm:hidden text-[10px] text-white/30 pb-2 leading-none">
          {forYouActive ? "Posts from across the network" : "Posts from people and entities you follow"}
        </p>
      </div>

      {/* ── Post-live confirmation ── */}
      {postLive && (
        <div className="flex items-center gap-2 mb-4 px-1 text-[#b08d57]/70 text-xs animate-in fade-in duration-200">
          <CheckCircle2 size={12} strokeWidth={2.5} className="shrink-0" />
          <span>Your post is live · Showing newest first</span>
        </div>
      )}

      {/* ── Feed states ── */}
      {isLoading ? (
        <div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="border-b border-white/[0.07] px-4 py-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.06] shrink-0" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <div className="h-3 bg-white/[0.06] rounded-full w-32" />
                  <div className="h-3 bg-white/[0.04] rounded-full w-full" />
                  <div className="h-3 bg-white/[0.04] rounded-full w-4/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : errorLine ? (
        <div className="wac-card p-8 flex flex-col items-center text-center gap-4">
          <Activity size={24} className="text-white/15" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold text-white/60 mb-1">Couldn't load the feed</p>
            <p className="text-xs text-white/30 max-w-xs leading-relaxed">{errorLine}</p>
          </div>
          <button
            onClick={() => load(activeTab, sortBy, userId, 0, false)}
            className="flex items-center gap-2 bg-[#b08d57] text-black hover:bg-[#9a7545] px-5 py-2 rounded-full text-sm font-bold transition"
          >
            <RefreshCw size={13} strokeWidth={2.5} />
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="wac-card py-20 px-6 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[#b08d57]/15 blur-xl rounded-full" />
            <div className="relative w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center shadow-lg backdrop-blur-xl">
              <Activity className="w-7 h-7 text-[#b08d57]/70" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-1.5 max-w-[320px]">
            <h3 className="text-[17px] font-medium text-white/90 tracking-wide text-balance">
              {activeTab === "foryou"
                ? "No posts yet"
                : "Nothing from your following yet"}
            </h3>
            <p className="text-[13px] text-white/40 leading-relaxed text-balance">
              {activeTab === "foryou"
                ? "Be the first to share something with the Albanian network."
                : "Follow people, businesses, or organizations to see their posts here."}
            </p>
          </div>
          {activeTab === "foryou" && userId && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-compose-sheet"))}
              className="px-5 py-2 rounded-full bg-[#b08d57] text-black text-sm font-bold hover:bg-[#9a7545] transition-colors"
            >
              Write a post
            </button>
          )}
          {activeTab === "following" && (
            <Link
              href="/directory"
              className="text-[13px] text-[#b08d57]/70 hover:text-[#b08d57] transition-colors font-medium"
            >
              Find people to follow →
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6 lg:gap-8 pb-4">
            {posts.map((post) =>
              post.post_intent === "ask" ? (
                <AskCard key={post.id} post={post} />
              ) : (
                <PostCard
                  key={post.id}
                  post={post}
                  initialIsFollowed={isAuthorFollowed(post, followSet)}
                  onFollowChange={refreshFollowSet}
                />
              )
            )}
          </div>

          {/* ── Load more ── */}
          {hasMore && (
            <div className="flex justify-center py-6">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/[0.12] text-sm font-medium text-white/50 hover:text-white/75 hover:border-white/[0.20] transition-colors disabled:opacity-40"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load more posts"
                )}
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
