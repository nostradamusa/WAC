"use client";

import { useState } from "react";
import Link from "next/link";
import { Hash, Building2, Landmark } from "lucide-react";
import FeedList from "@/components/feed/FeedList";
import WacSpotlightWidget from "./WacSpotlightWidget";
import { useActor } from "@/components/providers/ActorProvider";

export default function CommunityHub() {
  const { currentActor } = useActor();
  const isEntityContext = currentActor && currentActor.type !== "person";

  return (
    // Mobile: full height minus just the navbar (header hidden on mobile)
    // Desktop: minus navbar + sticky pulse header
    <div className="w-full bg-[var(--background)] h-[calc(100vh-3.5rem)] md:h-[calc(100vh-8.25rem)] overflow-hidden">
      <div className="max-w-[80rem] mx-auto px-4 h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12">

        {/* LEFT COLUMN — independent scroll */}
        <div className="col-span-1 lg:col-span-8 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="pt-4 md:pt-6 pb-12">

            {/* Acting-as banner — desktop only; mobile uses avatar menu */}
            {isEntityContext && (
              <div className="hidden md:flex items-center gap-2.5 mb-4 px-4 py-2.5 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.04]">
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

            <PulseHub />
          </div>
        </div>

        {/* RIGHT COLUMN — desktop only */}
        <div className="hidden lg:flex lg:col-span-4 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-col">
          <div className="space-y-4 pb-12 pt-6 pr-1">

            <WacSpotlightWidget />

            <div className="wac-card p-5">
              <h3 className="font-serif font-bold text-lg text-[var(--accent)] flex items-center gap-2 mb-4">
                <Hash className="w-4 h-4" />
                Trending
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs opacity-60">Global Summit 2026</div>
                  <div className="font-semibold text-sm hover:text-[var(--accent)] cursor-pointer transition-colors">#WAC2026 London Registration Open</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Mentorship Network</div>
                  <div className="font-semibold text-sm hover:text-[var(--accent)] cursor-pointer transition-colors">Spring Cohort Applications Live</div>
                </div>
                <div>
                  <div className="text-xs opacity-60">Tech Diaspora</div>
                  <div className="font-semibold text-sm hover:text-[var(--accent)] cursor-pointer transition-colors">Albanian AI Startup Funding Round</div>
                </div>
              </div>
            </div>

            <div className="wac-card p-5 bg-gradient-to-br from-[#111] to-[rgba(212,175,55,0.05)] border-[var(--accent)]/20">
              <h3 className="font-serif font-bold text-[var(--accent)] mb-2">Build Your Network</h3>
              <p className="text-xs opacity-70 mb-4 leading-relaxed">
                Connect with professionals sharing your roots. Manage your profile to get discovered.
              </p>
              <Link href="/profile" className="flex w-full items-center justify-center py-2.5 rounded-full border border-[var(--accent)]/50 text-[15px] font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-colors">
                Update Profile
              </Link>
            </div>

            <div className="flex flex-col items-center justify-center pt-4 pb-8 px-4 text-[12px] text-white/50 space-y-2 text-center">
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                <Link href="/about" className="hover:text-[var(--accent)] hover:underline transition-colors">About</Link>
                <Link href="/accessibility" className="hover:text-[var(--accent)] hover:underline transition-colors">Accessibility</Link>
                <Link href="/help" className="hover:text-[var(--accent)] hover:underline transition-colors">Help Center</Link>
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                <Link href="/terms" className="hover:text-[var(--accent)] hover:underline transition-colors">Privacy & Terms</Link>
                <Link href="/ads/choices" className="hover:text-[var(--accent)] hover:underline transition-colors">Ad Choices</Link>
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                <Link href="/advertising" className="hover:text-[var(--accent)] hover:underline transition-colors">Advertising</Link>
                <Link href="/business" className="hover:text-[var(--accent)] hover:underline transition-colors">Business Services</Link>
              </div>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
                <Link href="/app" className="font-bold text-white/70 hover:text-[var(--accent)] hover:underline transition-colors">Get the WAC app</Link>
                <Link href="/more" className="hover:text-[var(--accent)] hover:underline transition-colors">More</Link>
              </div>
              <div className="pt-2 flex items-center justify-center gap-2 text-white/40">
                <span className="font-serif font-bold italic text-white/60">WAC</span>
                <span>World Albanian Congress © {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Pulse feed ───────────────────────────────────────────────────────────────

function PulseHub() {
  const [refreshTrigger] = useState(0);
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full rounded-xl overflow-hidden shadow-2xl">
      <FeedList refreshTrigger={refreshTrigger} />
    </div>
  );
}
