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
  const [hasCalendarSubscription, setHasCalendarSubscription] = useState(false);
  const [showCalendarPrompt, setShowCalendarPrompt] = useState(false);
  const [isCalendarSaving, setIsCalendarSaving] = useState(false);
  const supportsCalendarSubscription =
    followingType === "organization" || followingType === "business";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) { setIsLoading(false); return; }

      Promise.all([
        supabase
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("follower_id", uid)
          .eq("following_type", followingType)
          .eq("following_id", followingId),
        supportsCalendarSubscription
          ? supabase
              .from("user_calendar_entity_subscriptions")
              .select("entity_id", { count: "exact", head: true })
              .eq("user_id", uid)
              .eq("entity_type", followingType)
              .eq("entity_id", followingId)
          : Promise.resolve({ count: 0 }),
      ]).then(([followResult, subscriptionResult]) => {
        setIsFollowing((followResult.count ?? 0) > 0);
        setHasCalendarSubscription((subscriptionResult.count ?? 0) > 0);
        setIsLoading(false);
      });
    });
  }, [followingType, followingId, supportsCalendarSubscription]);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId || isLoading) return;
    setIsLoading(true);
    const { data } = await supabase.rpc("toggle_follow", {
      p_following_type: followingType,
      p_following_id: followingId,
    });
    const nextIsFollowing = data === true;
    setIsFollowing(nextIsFollowing);
    if (!nextIsFollowing) {
      setShowCalendarPrompt(false);
    } else if (supportsCalendarSubscription && !hasCalendarSubscription) {
      setShowCalendarPrompt(true);
    }
    setIsLoading(false);
  }

  async function handleAddCalendar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId || !supportsCalendarSubscription || isCalendarSaving) return;

    setIsCalendarSaving(true);
    const { error } = await supabase
      .from("user_calendar_entity_subscriptions")
      .upsert(
        {
          user_id: userId,
          entity_type: followingType,
          entity_id: followingId,
        },
        { onConflict: "user_id,entity_type,entity_id" }
      );

    if (!error) {
      setHasCalendarSubscription(true);
      setShowCalendarPrompt(false);
    } else {
      console.error("Failed to add entity calendar subscription", error);
    }
    setIsCalendarSaving(false);
  }

  const buttonClassName =
    size === "sm"
      ? `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all disabled:opacity-50 ${
          isFollowing
            ? "bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]"
            : "border-[var(--accent)]/20 text-white/55 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
        } ${className ?? ""}`
      : `inline-flex items-center justify-center gap-2 w-full min-h-11 rounded-full px-5 py-3 text-sm font-semibold border transition-all disabled:opacity-50 ${
          isFollowing
            ? "bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)]"
            : "border-[var(--accent)]/20 text-white/55 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] hover:bg-white/5"
        } ${className ?? ""}`;

  const buttonContent = (
    <>
      {isLoading
        ? <Loader2 size={size === "sm" ? 11 : 15} className="animate-spin text-[var(--accent)]" />
        : isFollowing
          ? <UserCheck size={size === "sm" ? 11 : 15} />
          : <UserPlus size={size === "sm" ? 11 : 15} />
      }
      {isFollowing ? "Following" : "Follow"}
    </>
  );

  // Don't render anything if not signed in or still resolving auth
  if (!userId && !isLoading) return null;

  return (
    <div className="flex flex-col items-stretch gap-1.5">
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={buttonClassName}
      >
        {buttonContent}
      </button>

      {supportsCalendarSubscription && showCalendarPrompt && (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-left">
          <p className="text-[10px] font-medium text-white/58">
            Add this calendar to My Calendar?
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleAddCalendar}
              disabled={isCalendarSaving}
              className="rounded-full border border-[#b08d57]/25 bg-[#b08d57]/10 px-2.5 py-1 text-[10px] font-semibold text-[#d4b277] transition-colors hover:bg-[#b08d57]/16 disabled:opacity-40"
            >
              {isCalendarSaving ? "Adding..." : "Add"}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCalendarPrompt(false);
              }}
              className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-white/38 transition-colors hover:text-white/60 hover:border-white/[0.14]"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
