"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { NetworkPost } from "@/lib/types/network-feed";
import { Star, Users } from "lucide-react";
import PostCard from "./PostCard";

export default function FeedList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [posts, setPosts] = useState<NetworkPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorLine, setErrorLine] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const [sortBy, setSortBy] = useState<"top" | "recent">("top");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  async function fetchPosts(tab: "foryou" | "following", sortOpt: "top" | "recent") {
    setIsLoading(true);
    setErrorLine(null);
    try {
      let query = supabase
        .from("feed_posts")
        .select(`
          *,
          author_profile:profiles!author_profile_id(full_name, username, headline, avatar_url, is_verified),
          author_business:businesses(name, slug, business_type, is_verified),
          author_organization:organizations(name, slug, organization_type, is_verified),
          original_post:feed_posts!original_post_id(
            *,
            author_profile:profiles!author_profile_id(full_name, username, headline, avatar_url, is_verified),
            author_business:businesses(name, slug, business_type, is_verified),
            author_organization:organizations(name, slug, organization_type, is_verified)
          )
        `);

      if (sortOpt === "top") {
        query = query.order("hot_score", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query.limit(20);

      if (error) {
        throw new Error(error.message || JSON.stringify(error));
      }

      let fetchedPosts = (data as any[]) || [];

      // Fetch user's reactions for these specific posts
      if (fetchedPosts.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const postIds = fetchedPosts.map(p => p.id);
          const { data: myReactions } = await supabase
            .from("feed_likes")
            .select("post_id, reaction_type")
            .in("post_id", postIds)
            .eq("profile_id", session.user.id);

          if (myReactions && myReactions.length > 0) {
            const reactionMap = myReactions.reduce((acc: any, curr: any) => {
              acc[curr.post_id] = curr.reaction_type;
              return acc;
            }, {});

            fetchedPosts = fetchedPosts.map(p => ({
              ...p,
              user_reaction_type: reactionMap[p.id] || null
            }));
          }
        }
      }

      setPosts(fetchedPosts);
    } catch (err: any) {
      console.error("Error fetching feed:", err);
      setErrorLine(err.message || "Unknown fetching error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts(activeTab, sortBy);
  }, [refreshTrigger, activeTab, sortBy]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Feed Toggle Header */}
      <div className="wac-card overflow-hidden border-[var(--accent)]/30 bg-gradient-to-br from-[var(--surface-2)] to-[rgba(212,175,55,0.05)] mb-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab("foryou")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition-all duration-300 ${
              activeTab === "foryou"
                ? "border-[var(--accent)] shadow-[0_4px_12px_rgba(212,175,55,0.15)] bg-white/[0.02]"
                : "border-transparent opacity-60 hover:opacity-100 hover:bg-white/5"
            }`}
          >
            {activeTab === "foryou" && (
              <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center shrink-0 drop-shadow-[0_0_8px_rgba(212,175,55,0.6)] bg-[var(--accent)]">
                <img 
                  src="/images/wac-logo.jpg" 
                  alt="WAC" 
                  className="w-full h-full object-cover scale-[1.4] mix-blend-multiply" 
                />
              </div>
            )}
            <span className={`font-serif font-bold tracking-wide uppercase text-[15px] transition-all duration-300 ${
              activeTab === "foryou"
                ? "text-[var(--accent)] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                : "text-[var(--accent)]"
            }`}>
              For You
            </span>
          </button>

          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition-all duration-300 ${
              activeTab === "following"
                ? "border-[var(--accent)] shadow-[0_4px_12px_rgba(212,175,55,0.15)] bg-white/[0.02]"
                : "border-transparent opacity-60 hover:opacity-100 hover:bg-white/5"
            }`}
          >
            {activeTab === "following" && <Users className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)] drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]" />}
            <span className={`font-serif font-bold tracking-wide uppercase text-[15px] transition-all duration-300 ${
              activeTab === "following"
                ? "text-[var(--accent)] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                : "text-[var(--accent)]"
            }`}>
              Following
            </span>
          </button>
        </div>
      </div>

      {/* Sort By Dropdown */}
      <div className="flex justify-end items-center mb-6">
        <div className="relative text-xs text-white/50 flex items-center gap-2 cursor-pointer transition-colors" ref={sortRef}>
          <span>Sort by:</span>

          <button
            onClick={() => setShowSortOptions(!showSortOptions)}
            className="flex items-center gap-1.5 text-white font-bold hover:text-[var(--accent)] transition-colors py-1 pl-2 pr-1 rounded-md hover:bg-white/5"
          >
            <span className="capitalize">{sortBy}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showSortOptions ? 'rotate-180 text-[var(--accent)]' : ''}`}
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {/* Custom Dropdown Menu */}
          {showSortOptions && (
            <div className="absolute right-0 top-full mt-2 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20 animate-fade-in-up">
              <button
                onClick={() => { setSortBy("top"); setShowSortOptions(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === 'top' ? 'text-[var(--accent)] bg-white/5 font-bold' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
              >
                Top
              </button>
              <div className="h-[1px] w-full bg-white/5 mx-auto" />
              <button
                onClick={() => { setSortBy("recent"); setShowSortOptions(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === 'recent' ? 'text-[var(--accent)] bg-white/5 font-bold' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
              >
                Recent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="wac-card p-5 h-40 animate-pulse bg-[rgba(255,255,255,0.02)]"></div>
          ))}
        </div>
      ) : errorLine ? (
        <div className="wac-card py-6 px-4 bg-red-500/10 border-red-500/20 text-red-500 text-center text-sm">
          Error loading feed: {errorLine}
        </div>
      ) : posts.length === 0 ? (
        <div className="wac-card py-12 text-center">
          <h3 className="text-xl font-serif text-[var(--accent)] mb-2">
            {activeTab === "foryou" ? "Be the first to post!" : "No recent updates"}
          </h3>
          <p className="opacity-60 text-sm">
            {activeTab === "foryou"
              ? "There are no global updates in the network feed yet."
              : "When you follow members and groups, their updates will appear here."}
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
