"use client";

import Link from "next/link";
import { Star, Building2, Users, ChevronRight, MessageCircle, Plus, User } from "lucide-react";
import { useState } from "react";

export default function WacSpotlightWidget() {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--accent)]/[0.18] bg-gradient-to-b from-[#0e0e0e] to-[rgba(212,175,55,0.03)]">

      {/* Header strip — same height / padding / font as FeedList tab header */}
      <div className="flex items-center justify-between px-5 py-[14px] border-b border-[var(--accent)]/[0.12] bg-[var(--accent)]/[0.025]">
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-[var(--accent)] fill-[var(--accent)]/80" />
          <h3 className="font-serif font-bold tracking-[0.08em] uppercase text-[13px] text-[var(--accent)]">
            WAC Spotlight
          </h3>
        </div>
        <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/30">
          Builder
        </span>
      </div>

      {/* Body */}
      <div className="p-5">

        {/* Profile */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 border-2 border-[var(--accent)]/60 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-[0_0_16px_rgba(212,175,55,0.15)]">
            <span className="font-serif font-bold text-base text-[var(--accent)]">AK</span>
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-white text-[15px] leading-tight">Arben Krasniqi</h4>
            <p className="text-xs text-[var(--accent)]/80 font-medium mt-0.5 mb-1.5">
              Founder – Atlantic Logistics
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] text-white/40">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" /> New York
              </span>
              <span>· Roots: Peja</span>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="rounded-xl p-4 mb-5 border border-[var(--accent)]/[0.08] bg-[var(--accent)]/[0.025]">
          <p className="text-[12.5px] leading-relaxed italic text-white/75 mb-3">
            "The biggest mistake I made early on was thinking I had to do it all alone. The moment I started hiring people smarter than me and leaning into our community network, Atlantic Logistics transformed."
          </p>
          <Link
            href="/spotlight/arben-krasniqi"
            className="text-[var(--accent)] text-[11px] font-bold hover:underline flex items-center gap-1 w-max"
          >
            Read Full Interview <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Connect section */}
        <div>
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-white/30 mb-3">
            Connect & Discover
          </p>
          <div className="flex flex-col gap-2">
            {!isFollowing ? (
              <button
                onClick={() => setIsFollowing(true)}
                className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.1] rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors text-white/70 hover:text-white"
              >
                <Plus className="w-3.5 h-3.5" /> Follow Arben
              </button>
            ) : (
              <Link
                href="/spotlight/arben-krasniqi"
                className="w-full py-2.5 bg-[var(--accent)]/[0.06] hover:bg-[var(--accent)]/[0.12] border border-[var(--accent)]/30 text-[var(--accent)] rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <User className="w-3.5 h-3.5" /> View Profile
              </Link>
            )}
            <button className="w-full py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.1] rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors text-white/70 hover:text-white">
              <MessageCircle className="w-3.5 h-3.5" /> Message
            </button>
            <Link
              href="/directory?q=logistics"
              className="w-full py-2.5 bg-[var(--accent)]/[0.08] hover:bg-[var(--accent)]/[0.15] border border-[var(--accent)]/40 text-[var(--accent)] rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors mt-1"
            >
              <Users className="w-3.5 h-3.5" /> See Albanian founders in Logistics
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
