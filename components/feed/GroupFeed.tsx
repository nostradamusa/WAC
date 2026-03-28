"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { NetworkPost, PostMediaItem } from "@/lib/types/network-feed";
import { Activity, Loader2, RefreshCw } from "lucide-react";
import PostCard from "./PostCard";
import AskCard from "./AskCard";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

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

type FollowSet = Set<string>;

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

async function fetchGroupFeed(
  groupId: string,
  userId: string | null,
  offset: number,
): Promise<{ posts: NetworkPost[]; hasMore: boolean }> {

  const query = supabase
    .from("feed_posts")
    .select(BASE_SELECT)
    .eq("status", "published")
    .neq("post_type", "story")
    .eq("linked_group_id", groupId)
    .order("created_at", { ascending: false });

  const { data, error } = await query.range(offset, offset + PAGE_SIZE);
  if (error) throw new Error(error.message || JSON.stringify(error));

  const raw: any[] = data || [];
  const hasMore = raw.length > PAGE_SIZE;
  const page = raw.slice(0, PAGE_SIZE);

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

export default function GroupFeed({
  groupId,
  refreshKey,
}: {
  groupId: string;
  refreshKey?: number;
}) {
  const [posts, setPosts]                     = useState<NetworkPost[]>([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [isLoadingMore, setIsLoadingMore]     = useState(false);
  const [errorLine, setErrorLine]             = useState<string | null>(null);
  const [hasMore, setHasMore]                 = useState(false);
  const [offset, setOffset]                   = useState(0);
  const [followSet, setFollowSet]             = useState<FollowSet>(new Set());
  const [userId, setUserId]                   = useState<string | null>(null);

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
    uid: string | null,
    currentOffset: number,
    append: boolean,
  ) => {
    if (append) setIsLoadingMore(true);
    else { setIsLoading(true); setErrorLine(null); }

    try {
      const result = await fetchGroupFeed(groupId, uid, currentOffset);
      setPosts((prev) => append ? [...prev, ...result.posts] : result.posts);
      setHasMore(result.hasMore);
      setOffset(currentOffset + result.posts.length);
    } catch (err: any) {
      console.error("GroupFeed fetch error:", err);
      if (!append) setErrorLine(err.message || "Failed to load posts.");
    } finally {
      if (append) setIsLoadingMore(false);
      else setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load(userId, 0, false);
  }, [load, userId, refreshKey]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    load(userId, offset, true);
  }, [isLoadingMore, hasMore, load, userId, offset]);

  const refreshFollowSet = useCallback(async () => {
    if (!userId) return;
    const set = await fetchFollowSet(userId);
    setFollowSet(set);
  }, [userId]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="w-full">
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
    );
  }

  if (errorLine) {
    return (
      <div className="wac-card p-8 flex flex-col items-center text-center gap-4">
        <Activity size={24} className="text-white/15" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-semibold text-white/60 mb-1">Couldn't load posts</p>
          <p className="text-xs text-white/30 max-w-xs leading-relaxed">{errorLine}</p>
        </div>
        <button
          onClick={() => load(userId, 0, false)}
          className="flex items-center gap-2 bg-[#b08d57] text-black hover:bg-[#9a7545] px-5 py-2 rounded-full text-sm font-bold transition"
        >
          <RefreshCw size={13} strokeWidth={2.5} />
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="wac-card py-16 px-6 flex flex-col items-center justify-center text-center space-y-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-[#b08d57]/15 blur-xl rounded-full" />
          <div className="relative w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center shadow-lg backdrop-blur-xl">
            <Activity className="w-7 h-7 text-[#b08d57]/70" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-1.5 max-w-[320px]">
          <h3 className="text-[17px] font-medium text-white/90 tracking-wide text-balance">
            No group activity yet
          </h3>
          <p className="text-[13px] text-white/40 leading-relaxed text-balance">
            When members share updates, asks, or discussions here, they'll appear in this feed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 pb-4">
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
    </div>
  );
}
