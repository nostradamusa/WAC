"use client";

import Link from "next/link";
import { Star, Building2, TrendingUp, Users, Award, ExternalLink, ChevronRight, MessageCircle, Plus, User } from "lucide-react";
import { useState } from "react";

export default function WacSpotlightWidget() {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="wac-card overflow-hidden border-[var(--accent)]/30 bg-gradient-to-br from-[var(--surface-2)] to-[rgba(212,175,55,0.05)]">
      {/* Header */}
      <div className="bg-[var(--surface-2)]/50 px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-[var(--accent)] fill-[var(--accent)]" />
          <h3 className="font-serif font-bold text-sm tracking-wide text-[var(--accent)] uppercase">WAC Spotlight</h3>
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase opacity-50">Builder</span>
      </div>

      <div className="p-5">
        {/* Profile Info */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-[var(--surface)] border-2 border-[var(--accent)] flex-shrink-0 flex items-center justify-center overflow-hidden">
            <span className="font-serif font-bold text-lg text-[var(--accent)]">AK</span>
          </div>
          <div>
            <h4 className="font-bold text-white text-base">Arben Krasniqi</h4>
            <p className="text-xs text-[var(--accent)] font-medium mb-1">Founder – Atlantic Logistics</p>
            <div className="flex flex-wrap gap-2 text-[10px] opacity-60">
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> New York</span>
              <span className="flex items-center gap-1">• Roots: Peja</span>
            </div>
          </div>
        </div>

        {/* Narrative Snippet */}
        <div className="bg-white/5 rounded-2xl p-4 mb-5 border border-white/5 shadow-inner">
          <p className="text-xs leading-relaxed italic opacity-85 mb-3">
            "The biggest mistake I made early on was thinking I had to do it all alone. The moment I started hiring people smarter than me and leaning into our community network, Atlantic Logistics transformed."
          </p>
          <Link href="/spotlight/arben-krasniqi" className="text-[var(--accent)] text-xs font-bold hover:underline flex items-center gap-1 w-max">
            Read Full Interview <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* The Connect/Network Gateway (The Secret Sauce) */}
        <div>
          <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-3">Connect & Discover</p>
          <div className="flex flex-col gap-2.5">
             {!isFollowing ? (
               <button onClick={() => setIsFollowing(true)} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[15px] font-medium flex items-center justify-center gap-2 transition-colors">
                 <Plus className="w-4 h-4 opacity-70" /> Follow Arben
               </button>
             ) : (
               <Link href="/spotlight/arben-krasniqi" className="w-full py-2.5 bg-[var(--accent)]/5 hover:bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] rounded-full text-[15px] font-medium flex items-center justify-center gap-2 transition-colors">
                 <User className="w-4 h-4 opacity-70" /> View Profile
               </Link>
             )}
             <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[15px] font-medium flex items-center justify-center gap-2 transition-colors">
               <MessageCircle className="w-4 h-4 opacity-70" /> Message
             </button>
             <Link href="/directory?q=logistics" className="w-full py-2.5 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 border border-[var(--accent)]/50 text-[var(--accent)] rounded-full text-[15px] font-medium flex items-center justify-center gap-2 transition-colors mt-2">
               <Users className="w-4 h-4 opacity-70" /> See Albanian founders in Logistics
             </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
