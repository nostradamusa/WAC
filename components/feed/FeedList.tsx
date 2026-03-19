"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { NetworkPost } from "@/lib/types/network-feed";
import { Activity, Users, ChevronDown, Check } from "lucide-react";
import PostCard from "./PostCard";

// ─── V1 feed query ────────────────────────────────────────────────────────────
//
// Pool distinction (using author intent columns that already exist):
//   For You   → distribute_to_pulse = true   (discovery / global pool)
//   Following → distribute_to_following = true (source-controlled pool)
//
// Sort applies to both pools:
//   Top    → ORDER BY hot_score DESC (recency + engagement)
//   Recent → ORDER BY created_at DESC (pure chronological)
//
// V2: Following will additionally filter to posts whose source_id is in
// the current user's follows table (not yet built).

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
      author_business:businesses(name, slug, business_type, logo_url, is_verified),
      author_organization:organizations(name, slug, organization_type, logo_url, is_verified),
      original_post:feed_posts!original_post_id(
        *,
        author_profile:profiles!author_profile_id(full_name, username, headline, avatar_url, is_verified),
        author_business:businesses(name, slug, business_type, logo_url, is_verified),
        author_organization:organizations(name, slug, organization_type, logo_url, is_verified)
      )
    `)
    .eq("status", "published");

  // Pool filter
  if (tab === "following" && userId) {
    // V2: filter to posts from accounts the user actually follows
    const { data: followingIds } = await supabase.rpc("get_following_ids");
    if (followingIds && followingIds.length > 0) {
      query = query.in("source_id", followingIds);
    } else {
      // User follows nobody yet — return empty rather than the whole pulse
      return [];
    }
  } else if (tab === "following") {
    // Not signed in — fallback to distribute_to_following flag
    query = query.eq("distribute_to_following", true);
  } else {
    query = query.eq("distribute_to_pulse", true);
  }

  // Sort
  query = sortOpt === "top"
    ? query.order("hot_score", { ascending: false })
    : query.order("created_at", { ascending: false });

  const { data, error } = await query.limit(20);
  if (error) throw new Error(error.message || JSON.stringify(error));

  let posts: NetworkPost[] = (data as any[]) || [];

  // Hydrate user's own reactions
  if (posts.length > 0 && userId) {
    const postIds = posts.map((p) => p.id);
    const { data: myReactions } = await supabase
      .from("feed_likes")
      .select("post_id, reaction_type")
      .in("post_id", postIds)
      .eq("profile_id", userId);

    if (myReactions && myReactions.length > 0) {
      const reactionMap = myReactions.reduce((acc: any, curr: any) => {
        acc[curr.post_id] = curr.reaction_type;
        return acc;
      }, {});
      posts = posts.map((p) => ({
        ...p,
        user_reaction_type: reactionMap[p.id] ?? null,
      }));
    }
  }

  return posts;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeedList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [posts, setPosts]                     = useState<NetworkPost[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [errorLine, setErrorLine]             = useState<string | null>(null);
  const [activeTab, setActiveTab]             = useState<"foryou" | "following">("foryou");
  const [sortBy, setSortBy]                   = useState<"top" | "recent">("top");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  async function load(tab: "foryou" | "following", sort: "top" | "recent") {
    setIsLoading(true);
    setErrorLine(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const fetched = await fetchFeed(tab, sort, session?.user?.id ?? null);
      setPosts(fetched);
    } catch (err: any) {
      console.error("Error fetching feed:", err);
      setErrorLine(err.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load(activeTab, sortBy);
  }, [refreshTrigger, activeTab, sortBy]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const forYouActive    = activeTab === "foryou";
  const followingActive = activeTab === "following";

  return (
    <div>

      {/*
        Sticky tab bar — sticks to top-0 of the parent overflow-y scroll column.
        backdrop-blur-sm + bg-[var(--background)] ensures posts scrolling beneath
        are fully occluded. border-b provides visual cut without being heavy.
        No overflow-hidden ancestor between here and the scroll container.
      */}
      <div className="sticky top-0 z-10 bg-[var(--background)] backdrop-blur-sm border-b border-white/[0.08] py-3 mb-4 flex items-center justify-between">

        {/*
          Lens control — pill-tray pattern (For You / Following).
          Neutral white fill on active. NOT gold — mode selector, not filter.
        */}
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

        {/*
          Sort — right side, outlined chip (secondary filter pattern).
          Gold tint when open. Separate from lens tabs to preserve hierarchy.
        */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => setShowSortOptions((v) => !v)}
            aria-label="Sort feed"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              showSortOptions
                ? "border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] text-[#D4AF37]/80"
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
                        ? "text-[#D4AF37] bg-[#D4AF37]/[0.06] font-semibold"
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

      {/* ── Feed states ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="wac-card p-5 h-40 animate-pulse bg-white/[0.02]" />
          ))}
        </div>
      ) : errorLine ? (
        <div className="wac-card py-6 px-4 bg-red-500/10 border-red-500/20 text-red-400 text-center text-sm">
          Error loading feed: {errorLine}
        </div>
      ) : posts.length === 0 ? (
        <div className="wac-card py-12 text-center">
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
