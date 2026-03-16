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
          <div className="sticky top-24 space-y-4 pb-20">
            
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
              <Link href="/profile" className="block w-full text-center py-2 rounded-full border border-[var(--accent)]/50 text-xs font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-colors">
                Update Profile
              </Link>
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


