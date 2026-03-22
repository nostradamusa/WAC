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
    <article className="wac-card group overflow-hidden p-0 flex flex-col relative hover:-translate-y-0.5 transition-transform">

      {/* ── Banner ──────────────────────────────────────────────────────── */}
      <div className="relative h-16 shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800/50 to-slate-800/45" />

          {/* Save / share — hover reveal */}
        <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleSave}
            className="w-6 h-6 rounded-full bg-black/50 border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <Bookmark size={10} className={isSaved ? "fill-[#b08d57] text-[#b08d57]" : "text-white"} />
          </button>
          <button
            onClick={handleShare}
            className="w-6 h-6 rounded-full bg-black/50 border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <Share2 size={10} className="text-white" />
          </button>
        </div>
      </div>

      {/* Logo / initials — anchored to article, bridges banner/body boundary */}
      <div className="absolute left-4 top-10 z-20">
        {business.logo_url ? (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAvatarModal(true); }}
            className="block rounded-full hover:opacity-90 transition-opacity cursor-zoom-in"
            aria-label="View logo"
          >
            <img
              src={business.logo_url}
              alt={displayName}
              className="w-12 h-12 rounded-full border-2 border-[var(--card)] object-cover shadow-md ring-1 ring-white/[0.12]"
            />
          </button>
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-[var(--card)] bg-blue-500/20 flex items-center justify-center shadow-md ring-1 ring-blue-500/[0.15]">
            {initials ? (
              <span className="text-sm font-semibold uppercase text-blue-300">{initials}</span>
            ) : (
              <Briefcase size={18} className="text-blue-300" strokeWidth={1.5} />
            )}
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-4 pt-14 pb-4">

        {/* Name + verified */}
        <div className="flex items-center gap-1 min-w-0 mb-0.5">
          <h2 className="text-sm font-semibold leading-tight truncate">{displayName}</h2>
          {business.is_verified && <VerifiedBadge className="shrink-0 mt-px" />}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-[11px] text-white/55 line-clamp-1 leading-snug">{subtitle}</p>
        )}

        {/* Location */}
        {location && (
          <span className="flex items-center gap-0.5 mt-0.5 text-[11px] text-white/35">
            <MapPin size={9} className="shrink-0" />
            {location}
          </span>
        )}

        {/* Hiring badge */}
        {isHiring && (
          <div className="mt-2.5">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border bg-green-500/10 text-green-400 border-green-500/20">
              <UserPlus size={10} /> Hiring
            </span>
          </div>
        )}

        {/* Description */}
        {business.description && (
          <p className="text-[11px] text-white/30 line-clamp-2 leading-snug mt-2">
            {business.description}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-3" />

        {/* CTAs */}
        <div className="flex gap-1.5 mt-3">
          <FollowButton followingType="business" followingId={business.id} size="sm" className="flex-1" />
          <Link
            href={profileHref}
            className="flex-1 flex items-center justify-center py-1.5 px-3 rounded-full bg-[#b08d57] text-black text-xs font-bold hover:bg-[#9a7545] transition-colors"
          >
            View
          </Link>
        </div>
      </div>

      {/* Toast */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#b08d57] text-black px-4 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all duration-300 z-30 ${
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
