"use client";

import { useState } from "react";
import Link from "next/link";
import React from "react";
import {
  Briefcase,
  Users,
  User,
  Hash,
} from "lucide-react";

import CreatePostBox from "@/components/feed/CreatePostBox";
import FeedList from "@/components/feed/FeedList";
import WacSpotlightWidget from "./WacSpotlightWidget";

export default function CommunityHub() {
  return (
    <div className="w-full bg-[var(--background)] pt-0 pb-6 lg:py-8 relative z-20">
      <div className="max-w-[80rem] mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12">
        
        {/* LEFT & CENTER COLUMN: THE PULSE STAGE */}
        <div className="col-span-1 lg:col-span-8">
          <PulseHub />
        </div>

        {/* RIGHT COLUMN: DISCOVER (Sticky) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-4 pb-12 pt-1 pr-1">
              
              {/* WAC Spotlight Discovery Engine */}
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

            {/* Right Sidebar Footer */}
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
    </div>
  );
}

// ----------------------------------------------------------------------
// PULSE HUB (THE FEED)
// ----------------------------------------------------------------------
function PulseHub() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full rounded-xl overflow-hidden shadow-2xl">
      



      
      <div className="mt-2">
        <FeedList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}


