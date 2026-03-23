"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bookmark, Share2, Briefcase, MapPin, UserPlus, X } from "lucide-react";
import type { BusinessProfile } from "@/lib/types/business-directory";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import FollowButton from "@/components/ui/FollowButton";

// ── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function abbrev(country: string | null) {
  if (!country) return "";
  const n = country.trim().toLowerCase();
  if (n === "united states" || n === "united states of america" || n === "usa") return "USA";
  if (n === "united kingdom" || n === "uk") return "UK";
  return country;
}

function buildLocation(b: BusinessProfile) {
  return [b.city?.trim(), b.state?.trim(), abbrev(b.country)].filter(Boolean).join(", ");
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BusinessCard({ business }: { business: BusinessProfile }) {
  const [isSaved,         setIsSaved]         = useState(false);
  const [showToast,       setShowToast]       = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const displayName  = business.name;
  const profileHref  = `/businesses/${business.slug}`;
  const initials     = getInitials(displayName);
  const subtitle     = business.industry_name?.trim() || business.business_type?.trim() || "";
  const location     = buildLocation(business);
  const isHiring     = business.hiring_status === "hiring" || business.hiring_status === "actively_hiring";

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved((v) => !v);
  }

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}${profileHref}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }

  return (
    <article className="wac-card group overflow-hidden p-5 flex flex-col sm:flex-row items-start sm:items-stretch gap-5 relative hover:-translate-y-0.5 transition-transform min-h-[140px]">
      
      {/* ── Ambient Glow (Entity Differentiation) ── */}
      <div className="absolute top-0 left-0 w-[40%] h-[150%] bg-gradient-to-r from-blue-500/[0.04] to-transparent pointer-events-none -translate-y-1/4" />

      {/* ── Quiet Hover Utilities (Save/Share) ── */}
      <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 z-20 bg-black/40 backdrop-blur-md rounded-full p-0.5 border border-white/5 shadow-xl">
        <button
          onClick={handleSave}
          title={isSaved ? "Saved" : "Save"}
          className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Bookmark size={13} className={isSaved ? "fill-[#b08d57] text-[#b08d57]" : ""} />
        </button>
        <button
          onClick={handleShare}
          title="Share"
          className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Share2 size={13} />
        </button>
      </div>

      {/* ── Zone 1: Identity ────────────────────────────────────────────── */}
      <div className="shrink-0 pt-0.5 relative z-10 w-16">
        {business.logo_url ? (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAvatarModal(true); }}
            className="block rounded-full hover:opacity-90 transition-transform hover:scale-105 cursor-zoom-in relative"
            aria-label="View logo"
          >
            <div className="absolute inset-[-4px] rounded-full border border-blue-500/30 opacity-60" />
            <img
              src={business.logo_url}
              alt={displayName}
              className="w-16 h-16 rounded-full border border-blue-500/20 object-cover relative z-10"
            />
          </button>
        ) : (
          <div className="w-16 h-16 rounded-full border border-blue-500/20 bg-blue-500/10 flex items-center justify-center text-lg font-semibold uppercase text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] relative">
            <div className="absolute inset-[-4px] rounded-full border border-blue-500/30 opacity-60" />
            {initials ? initials : <Briefcase size={22} className="text-blue-400" strokeWidth={1.5} />}
          </div>
        )}
      </div>

      {/* ── Zone 2: Main Content ────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 self-stretch pr-2 relative z-10">
        
        {/* Entity Badge */}
        <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400/80 block mb-1">
          Business
        </span>

        <Link href={profileHref} className="group/title w-fit max-w-full mb-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-lg font-bold text-white/95 leading-tight group-hover/title:text-blue-400 transition-colors truncate">
              {displayName}
            </h2>
            {business.is_verified && <VerifiedBadge size="md" className="shrink-0 -mt-0.5" />}
          </div>
        </Link>

        {/* Industry / Type */}
        {subtitle && (
          <p className="text-[13px] font-medium text-white/60 line-clamp-1 mb-1">
            {subtitle}
          </p>
        )}

        {/* Description Snippet */}
        {business.description && (
          <p className="text-xs text-white/40 line-clamp-1 leading-snug mb-2 pr-4">
            {business.description}
          </p>
        )}

        {/* Dynamic spacer pushes metadata uniformly to bottom */}
        <div className="flex-1 min-h-[12px]" />

        {/* Location & Tags Row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-auto">
          {location && (
            <span className="flex items-center gap-1 text-[11px] text-white/40 font-medium tracking-wide">
              <MapPin size={10} className="shrink-0" />
              {location}
            </span>
          )}
          
          {isHiring && (
            <span className="inline-flex items-center gap-1 rounded-sm px-1.5 py-[2px] text-[10px] font-semibold tracking-wide border-b bg-green-500/10 text-green-400 border-b-green-500/20 ml-1">
              <UserPlus size={10} /> Hiring
            </span>
          )}
        </div>
      </div>

      {/* ── Zone 3: Main CTAs ──────────────────────────────────────────── */}
      <div className="flex sm:flex-col items-center sm:items-end justify-center sm:self-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto shrink-0 z-10 pl-0 sm:pl-2">
        <FollowButton 
          followingType="business" 
          followingId={business.id} 
          size="sm" 
          className="h-[32px] w-[96px] justify-center !px-0 shrink-0 shadow-sm" 
        />
        <Link
          href={profileHref}
          className="h-[32px] w-[96px] flex items-center justify-center rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/5 text-xs font-semibold text-white tracking-wide transition-colors shrink-0 shadow-sm"
        >
          Visit Hub
        </Link>
      </div>

      {/* Toast */}
      {/* ... */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#b08d57] text-black px-4 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all duration-300 z-30 ${
          showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        Link copied!
      </div>

      {/* Logo lightbox */}
      {showAvatarModal && business.logo_url && createPortal(
        <div
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 cursor-pointer animate-in fade-in duration-150"
          onClick={() => setShowAvatarModal(false)}
        >
          <div className="relative max-w-[280px] w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={business.logo_url}
              alt={displayName}
              className="w-full aspect-square rounded-3xl object-cover shadow-2xl"
            />
            <p className="text-center text-sm text-white/55 font-medium">{displayName}</p>
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={13} className="text-white/70" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </article>
  );
}
