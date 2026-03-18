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
    <div className="space-y-4">

      {/* ── Feed header ── */}
      <div className="rounded-2xl border border-[var(--accent)]/[0.18] bg-gradient-to-b from-[#0e0e0e] to-[rgba(212,175,55,0.03)]">

        {/* For You | ⇅ | Following */}
        <div className="flex">

          {/* For You */}
          <button
            onClick={() => setActiveTab("foryou")}
            className={`relative flex-1 flex items-center justify-center gap-2 px-5 py-[14px] transition-all duration-200 ${
              forYouActive ? "text-[var(--accent)]" : "text-white/35 hover:text-white/55"
            }`}
          >
            <Activity
              size={13}
              strokeWidth={forYouActive ? 2.5 : 1.8}
              className={forYouActive ? "fill-[var(--accent)]/20" : ""}
            />
            <span className="font-serif font-bold tracking-[0.08em] uppercase text-[13px]">For You</span>
            {forYouActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] w-10 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
            )}
          </button>

          {/* Sort chevron — applies to whichever tab is active */}
          <div ref={sortRef} className="relative flex items-center self-stretch">
            <button
              onClick={() => setShowSortOptions((v) => !v)}
              aria-label="Sort feed"
              className={`flex items-center gap-0.5 transition-all duration-150 ${
                showSortOptions ? "text-[var(--accent)]" : "text-white/30 hover:text-white/55"
              }`}
            >
              <ChevronDown size={11} strokeWidth={2} />
              <span className="text-[9px] font-bold tracking-wide leading-none">
                {sortBy === "top" ? "Top" : "Recent"}
              </span>
            </button>

            {showSortOptions && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-28 bg-[#111] border border-[var(--accent)]/[0.15] rounded-xl shadow-2xl overflow-hidden z-20">
                {(["top", "recent"] as const).map((opt) => {
                  const selected = sortBy === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => { setSortBy(opt); setShowSortOptions(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors ${
                        selected
                          ? "text-[var(--accent)] bg-[var(--accent)]/[0.06] font-bold"
                          : "text-white/60 hover:bg-white/[0.04] hover:text-white"
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

          {/* Following */}
          <button
            onClick={() => setActiveTab("following")}
            className={`relative flex-1 flex items-center justify-center gap-2 px-5 py-[14px] transition-all duration-200 ${
              followingActive ? "text-[var(--accent)]" : "text-white/35 hover:text-white/55"
            }`}
          >
            <Users
              size={13}
              strokeWidth={followingActive ? 2.5 : 1.8}
              className={followingActive ? "fill-[var(--accent)]/20" : ""}
            />
            <span className="font-serif font-bold tracking-[0.08em] uppercase text-[13px]">Following</span>
            {followingActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] w-10 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
            )}
          </button>

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
          <h3 className="text-xl font-serif text-[var(--accent)] mb-2">
            {activeTab === "foryou" ? "Be the first to post!" : "No posts yet"}
          </h3>
          <p className="opacity-50 text-sm">
            {activeTab === "foryou"
              ? "There are no global updates in the network feed yet."
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
