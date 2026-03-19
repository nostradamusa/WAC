"use client";

import Link from "next/link";
import { Hash, Building2, Landmark } from "lucide-react";
import FeedList from "@/components/feed/FeedList";
import WacSpotlightWidget from "./WacSpotlightWidget";
import { useActor } from "@/components/providers/ActorProvider";

export default function CommunityHub() {
  const { currentActor } = useActor();
  const isEntityContext = currentActor && currentActor.type !== "person";

  return (
    // Mobile: full height minus navbar only
    // Desktop: full height minus navbar (3.5rem) + sticky pulse header (~4.75rem)
    <div className="w-full bg-[var(--background)] h-[calc(100vh-3.5rem)] md:h-[calc(100vh-8.25rem)] overflow-hidden">
      <div className="max-w-[80rem] mx-auto px-4 h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12">

        {/* ── LEFT COLUMN — independent scroll, FeedList sticky header owns top spacing ── */}
        <div className="col-span-1 lg:col-span-8 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          {/* Acting-as banner — desktop only; no horizontal padding (column provides it) */}
          {isEntityContext && (
            <div className="hidden md:flex items-center gap-2.5 mt-4 mb-4 py-2.5 px-3 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04]">
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
            FeedList owns its sticky tab bar at top-0 of this scroll column.
            No overflow-hidden wrapper here — that blocks position: sticky.
          */}
          <div className="pb-12">
            <FeedList />
          </div>
        </div>

        {/* ── RIGHT COLUMN — desktop only, independent scroll ── */}
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
              {/* Tier 2: outlined gold */}
              <Link
                href="/profile"
                className="flex w-full items-center justify-center py-2 rounded-full border border-[#D4AF37]/30 text-sm font-medium text-[#D4AF37]/70 hover:bg-[#D4AF37]/10 transition-colors"
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
