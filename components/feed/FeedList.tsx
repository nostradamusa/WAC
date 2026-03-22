"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { NetworkPost, PostMediaItem } from "@/lib/types/network-feed";
import { Activity, Users, ChevronDown, Check, RefreshCw, CheckCircle2 } from "lucide-react";
import PostCard from "./PostCard";
import CreatePostBox from "./CreatePostBox";

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

// ─── Feed query ────────────────────────────────────────────────────────────────

async function fetchFeed(
  tab: "foryou" | "following",
  sortOpt: "top" | "recent",
  userId: string | null,
): Promise<NetworkPost[]> {
  let query = supabase
    .from("feed_posts")
    .select(`
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
    `)
    .eq("status", "published");

  if (tab === "following" && userId) {
    const { data: followingIds } = await supabase.rpc("get_following_ids");
    if (followingIds && followingIds.length > 0) {
      query = query.in("source_id", followingIds);
    } else {
      return [];
    }
  } else if (tab === "following") {
    query = query.eq("distribute_to_following", true);
  } else {
    query = query.eq("distribute_to_pulse", true);
  }

  if (sortOpt === "top") {
    query = query
      .order("likes_count", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query.limit(20);
  if (error) throw new Error(error.message || JSON.stringify(error));

  const raw: any[] = data || [];

  if (raw.length > 0 && userId) {
    const postIds = raw.map((p) => p.id);
    const { data: myReactions } = await supabase
      .from("feed_likes")
      .select("post_id, reaction_type")
      .in("post_id", postIds)
      .eq("profile_id", userId);

    if (myReactions && myReactions.length > 0) {
      const reactionMap = myReactions.reduce((acc: Record<string, string>, curr: any) => {
        acc[curr.post_id] = curr.reaction_type;
        return acc;
      }, {});

      return raw.map((p) => normalizePost({ ...p, user_reaction_type: reactionMap[p.id] ?? null }));
    }
  }

  return raw.map(normalizePost);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeedList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [posts, setPosts]                     = useState<NetworkPost[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [errorLine, setErrorLine]             = useState<string | null>(null);
  const [activeTab, setActiveTab]             = useState<"foryou" | "following">("foryou");
  const [sortBy, setSortBy]                   = useState<"top" | "recent">("top");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [internalRefresh, setInternalRefresh] = useState(0);
  const [postLive, setPostLive]               = useState(false);
  const [tabBarHidden, setTabBarHidden]       = useState(false);
  const postLiveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (tab: "foryou" | "following", sort: "top" | "recent") => {
    setIsLoading(true);
    setErrorLine(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const fetched = await fetchFeed(tab, sort, session?.user?.id ?? null);
      setPosts(fetched);
    } catch (err: any) {
      console.error("FeedList fetch error:", err);
      setErrorLine(err.message || "Failed to load feed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeTab, sortBy);
  }, [load, refreshTrigger, internalRefresh, activeTab, sortBy]);

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

  // ── Scroll-aware tab bar hide ─────────────────────────────────────────────
  // Listens for the wac-feed-scroll event dispatched by CommunityHub's left
  // column onScroll handler. Hides the tab bar when scrolling down past the
  // stories row (y > 100), reveals it on any upward scroll.
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<{ direction: string; y: number }>).detail;
      if (d.direction === "down" && d.y > 100) setTabBarHidden(true);
      else if (d.direction === "up") setTabBarHidden(false);
    };
    window.addEventListener("wac-feed-scroll", handler);
    return () => window.removeEventListener("wac-feed-scroll", handler);
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

      {/*
        Sticky tab bar — sticks to top-0 of the parent overflow-y scroll column.
        When tabBarHidden, collapses to height-0 with a smooth max-height + opacity
        transition so feed content fills the freed space. overflow:hidden on the
        outer sticky wrapper is safe here — it only clips children, it does NOT
        break the element's own sticky positioning.
        The sort dropdown (absolute-positioned child) is only interactable when
        the bar is visible, so overflow:hidden is harmless when collapsed.
      */}
      <div
        className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md"
        style={{
          maxHeight: tabBarHidden ? 0 : 80,
          overflow: tabBarHidden ? "hidden" : "visible",
          opacity: tabBarHidden ? 0 : 1,
          pointerEvents: tabBarHidden ? "none" : undefined,
          transition: "max-height 0.3s ease, opacity 0.25s ease",
        }}
      >
        <div className="border-b border-white/[0.08] py-3 mb-4 flex items-center justify-between">

          <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.05] border border-white/[0.09] rounded-full">
            <button
              onClick={() => setActiveTab("foryou")}
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

          <div ref={sortRef} className="relative">
            <button
              onClick={() => setShowSortOptions((v) => !v)}
              aria-label="Sort feed"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
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

      {/* ── Post-live confirmation — inline, auto-dismisses after 4s ── */}
      {postLive && (
        <div className="flex items-center gap-2 mb-4 px-1 text-[#b08d57]/70 text-xs animate-in fade-in duration-200">
          <CheckCircle2 size={12} strokeWidth={2.5} className="shrink-0" />
          <span>Your post is live · Showing newest first</span>
        </div>
      )}

      {/* ── Feed states ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="wac-card p-5 h-40 animate-pulse bg-white/[0.02]" />
          ))}
        </div>
      ) : errorLine ? (
        <div className="wac-card p-8 flex flex-col items-center text-center gap-4">
          <Activity size={24} className="text-white/15" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold text-white/60 mb-1">
              Couldn't load the feed
            </p>
            <p className="text-xs text-white/30 max-w-xs leading-relaxed">
              {errorLine}
            </p>
          </div>
          <button
            onClick={() => load(activeTab, sortBy)}
            className="flex items-center gap-2 bg-[#b08d57] text-black hover:bg-[#9a7545] px-5 py-2 rounded-full text-sm font-bold transition"
          >
            <RefreshCw size={13} strokeWidth={2.5} />
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="wac-card py-12 px-6 text-center">
          <Activity size={28} className="mx-auto text-white/15 mb-4" strokeWidth={1.5} />
          <h3 className="text-sm font-semibold text-white/50 mb-1.5">
            {activeTab === "foryou"
              ? "The feed is quiet right now."
              : "Nothing from your following yet."}
          </h3>
          <p className="text-xs text-white/30 max-w-xs mx-auto leading-relaxed">
            {activeTab === "foryou"
              ? "Posts from across the network will appear here as people and organizations publish."
              : "Follow people, businesses, or organizations to see their updates here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

    </div>
  );
}
