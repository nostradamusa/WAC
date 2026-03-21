"use client";

import { useEffect, useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  followingType: "person" | "business" | "organization";
  followingId: string;
  /** "sm" → compact chip, "md" → full-width button */
  size?: "sm" | "md";
  className?: string;
};

export default function FollowButton({ followingType, followingId, size = "md", className }: Props) {
  const [isFollowing, setIsFollowing]   = useState(false);
  const [isLoading, setIsLoading]       = useState(true);
  const [userId, setUserId]             = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) { setIsLoading(false); return; }

      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", uid)
        .eq("following_type", followingType)
        .eq("following_id", followingId)
        .then(({ count }) => {
          setIsFollowing((count ?? 0) > 0);
          setIsLoading(false);
        });
    });
  }, [followingType, followingId]);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId || isLoading) return;
    setIsLoading(true);
    const { data } = await supabase.rpc("toggle_follow", {
      p_following_type: followingType,
      p_following_id: followingId,
    });
    setIsFollowing(data === true);
    setIsLoading(false);
  }

  // Don't render anything if not signed in or still resolving auth
  if (!userId && !isLoading) return null;

  if (size === "sm") {
    return (
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all disabled:opacity-50 ${
          isFollowing
            ? "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]"
            : "border-white/20 text-white/55 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
        } ${className ?? ""}`}
      >
        {isLoading
          ? <Loader2 size={11} className="animate-spin" />
          : isFollowing
            ? <UserCheck size={11} />
            : <UserPlus size={11} />
        }
        {isFollowing ? "Following" : "Follow"}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`inline-flex items-center justify-center gap-2 w-full min-h-11 rounded-full px-5 py-3 text-sm font-semibold border transition-all disabled:opacity-50 ${
        isFollowing
          ? "bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)]"
          : "border-white/20 text-white/55 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] hover:bg-white/5"
      } ${className ?? ""}`}
    >
      {isLoading
        ? <Loader2 size={15} className="animate-spin" />
        : isFollowing
          ? <UserCheck size={15} />
          : <UserPlus size={15} />
      }
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
