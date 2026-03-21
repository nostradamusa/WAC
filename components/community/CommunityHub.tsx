"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { Hash, Building2, Landmark } from "lucide-react";
import FeedList from "@/components/feed/FeedList";
import WacSpotlightWidget from "./WacSpotlightWidget";
import { useActor } from "@/components/providers/ActorProvider";

export default function CommunityHub() {
  const { currentActor } = useActor();
  const isEntityContext = currentActor && currentActor.type !== "person";

  // ── Scroll event relay ────────────────────────────────────────────────────
  // Dispatches wac-feed-scroll so Navbar and FeedList can hide their chrome.
  //
  // RAF-throttled: collapses rapid scroll events to one dispatch per frame,
  // which eliminates the momentum-scroll oscillation that was causing the
  // navbar and tab bar to flicker rapidly on iOS.
  //
  // Mobile only — window.innerWidth >= 768 bails out immediately so the
  // desktop nav is never affected.

  const lastScrollY  = useRef(0);
  const rafPending   = useRef<number | null>(null);

  function handleLeftScroll(e: React.UIEvent<HTMLDivElement>) {
    if (window.innerWidth >= 768) return;

    const el = e.currentTarget;

    // Coalesce multiple events per frame into one
    if (rafPending.current !== null) return;

    rafPending.current = requestAnimationFrame(() => {
      rafPending.current = null;

      const y     = el.scrollTop;
      const delta = y - lastScrollY.current;

      // Ignore sub-pixel jitter
      if (Math.abs(delta) < 5) return;

      lastScrollY.current = y;

      window.dispatchEvent(
        new CustomEvent("wac-feed-scroll", {
          detail: { direction: delta > 0 ? "down" : "up", y },
        })
      );
    });
  }

  useEffect(() => {
    return () => {
      if (rafPending.current !== null) cancelAnimationFrame(rafPending.current);
    };
  }, []);

  // ── Layout note ───────────────────────────────────────────────────────────
  // Mobile: h-dvh fills the full dynamic viewport. The <main> in the Pulse
  // page has no pt-14 on mobile, so this div starts at y=0 (behind the fixed
  // navbar). Navbar clearance is provided inside the scroll content via
  // pt-14 on the inner wrapper. This means the outer div's dimensions NEVER
  // change during scroll — no reflow, no jitter.
  //
  // Desktop: h-[calc(100vh-8.25rem)] accounts for the fixed navbar (3.5rem)
  // plus the sticky Pulse page header (~4.75rem).

  return (
    <div className="w-full bg-[var(--background)] overflow-hidden h-dvh md:h-[calc(100vh-8.25rem)]">
      <div className="max-w-[80rem] mx-auto px-4 h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12">

        {/* ── LEFT COLUMN — independent scroll ─────────────────────────────── */}
        <div
          className="col-span-1 lg:col-span-8 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          onScroll={handleLeftScroll}
        >

          {/* Acting-as banner — desktop only */}
          {isEntityContext && (
            <div className="hidden md:flex items-center gap-2.5 mt-3 mb-2 py-2.5 px-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04]">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center shrink-0">
                {currentActor.avatar_url
                  ? <img src={currentActor.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[var(--accent)] text-[10px] font-bold">{currentActor.name.charAt(0)}</span>
                }
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                {currentActor.type === "organization"
                  ? <Landmark size={11} className="text-[var(--accent)]/60 shrink-0" />
                  : <Building2 size={11} className="text-[var(--accent)]/60 shrink-0" />
                }
                <span className="text-[11px] text-white/40">Acting as</span>
                <span className="text-[11px] font-semibold text-[var(--accent)] truncate">{currentActor.name}</span>
              </div>
            </div>
          )}

          {/*
            pt-14 on mobile: the fixed navbar (56px) overlays the top of this
            scroll container, so we add matching inner padding so content starts
            below it at scroll y=0. As the user scrolls down and the navbar hides,
            this padding scrolls away naturally — no outer layout change needed.

            pt-1 on desktop: the page-level pt-14 already provides clearance.

            FeedList owns its sticky tab bar at top-0 of this scroll column.
            No overflow-hidden wrapper here — that would break position:sticky.
          */}
          <div className="pb-12 pt-1">
            <FeedList />
          </div>
        </div>

        {/* ── RIGHT COLUMN — desktop only, independent scroll ────────────── */}
        <div className="hidden lg:flex lg:col-span-4 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-col">
          <div className="space-y-4 pb-12 pt-4 pr-1">

            {/* WAC Spotlight — featured person card */}
            <WacSpotlightWidget />

            {/* Trending — hardcoded seed data; will be dynamic in V2 */}
            <div className="wac-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Hash size={11} className="text-white/30 shrink-0" />
                <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/45">
                  Trending
                </span>
              </div>
              <div className="space-y-3.5">
                <div>
                  <div className="text-[10px] text-white/30 mb-0.5">Global Summit 2026</div>
                  <div className="text-sm font-semibold text-white/75 leading-snug">
                    #WAC2026 London Registration Open
                  </div>
                </div>
                <div className="border-t border-white/[0.05] pt-3.5">
                  <div className="text-[10px] text-white/30 mb-0.5">Mentorship Network</div>
                  <div className="text-sm font-semibold text-white/75 leading-snug">
                    Spring Cohort Applications Live
                  </div>
                </div>
                <div className="border-t border-white/[0.05] pt-3.5">
                  <div className="text-[10px] text-white/30 mb-0.5">Tech Diaspora</div>
                  <div className="text-sm font-semibold text-white/75 leading-snug">
                    Albanian AI Startup Funding Round
                  </div>
                </div>
              </div>
            </div>

            {/* Build Your Network */}
            <div className="wac-card p-5">
              <h3 className="text-sm font-semibold text-white mb-1.5">Build Your Network</h3>
              <p className="text-xs text-white/45 mb-4 leading-relaxed">
                Keep your profile current so the right people can find and connect with you.
              </p>
              <Link
                href="/profile"
                className="flex w-full items-center justify-center py-2 rounded-full border border-rose-500/30 text-sm font-medium text-rose-400/70 hover:bg-rose-500/10 transition-colors"
              >
                Update Profile
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
