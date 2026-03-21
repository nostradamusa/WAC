"use client";

import Link from "next/link";
import { Star, Building2, Users, ChevronRight, Plus, User } from "lucide-react";
import { useState } from "react";

export default function WacSpotlightWidget() {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    /*
      wac-card base with subtle gold tint border — signals "featured" without
      a custom container. Consistent with the rest of the card system.
    */
    <div className="wac-card overflow-hidden border-[#b08d57]/[0.18]">

      {/* Header strip */}
      <div className="flex items-center justify-between px-5 py-[14px] border-b border-white/[0.06] bg-[#b08d57]/[0.025]">
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-[#b08d57] fill-[#b08d57]/80" />
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/70">
            WAC Spotlight
          </span>
        </div>
        <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/25">
          Builder
        </span>
      </div>

      {/* Body */}
      <div className="p-5">

        {/* Profile */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#b08d57]/10 border border-[#b08d57]/40 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-[0_0_16px_rgba(176,141,87,0.10)]">
            <span className="font-serif font-bold text-base text-[#b08d57]">AK</span>
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-white text-[15px] leading-tight">Arben Krasniqi</h4>
            <p className="text-xs text-[#b08d57]/75 font-medium mt-0.5 mb-1.5">
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
        <div className="rounded-xl p-4 mb-5 border border-[#b08d57]/[0.08] bg-[#b08d57]/[0.02]">
          <p className="text-[12.5px] leading-relaxed italic text-white/70 mb-3">
            "The biggest mistake I made early on was thinking I had to do it all alone. The moment I
            started hiring people smarter than me and leaning into our community network, Atlantic
            Logistics transformed."
          </p>
          <Link
            href="/spotlight/arben-krasniqi"
            className="text-[#b08d57]/70 text-[11px] font-bold hover:text-[#b08d57] transition-colors flex items-center gap-1 w-max"
          >
            Read Full Interview <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Actions */}
        <div>
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/25 mb-3">
            Connect &amp; Discover
          </p>
          <div className="flex flex-col gap-2">
            {/* Follow / View Profile — Tier 3 ghost */}
            {!isFollowing ? (
              <button
                onClick={() => setIsFollowing(true)}
                className="w-full py-2.5 border border-white/[0.12] rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors text-white/55 hover:text-white/80 hover:border-white/[0.18]"
              >
                <Plus className="w-3.5 h-3.5" /> Follow Arben
              </button>
            ) : (
              <Link
                href="/spotlight/arben-krasniqi"
                className="w-full py-2.5 border border-white/[0.12] rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors text-white/55 hover:text-white/80 hover:border-white/[0.18]"
              >
                <User className="w-3.5 h-3.5" /> View Profile
              </Link>
            )}

            {/* Directory deep-link — Tier 2 outlined gold (higher signal, navigates away) */}
            <Link
              href="/directory?q=logistics"
              className="w-full py-2.5 border border-[#b08d57]/30 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-colors text-[#b08d57]/70 hover:bg-[#b08d57]/10"
            >
              <Users className="w-3.5 h-3.5" /> See Albanian founders in Logistics
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
