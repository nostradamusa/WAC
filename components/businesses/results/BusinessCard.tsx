"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Share2, Briefcase, MapPin, UserPlus } from "lucide-react";
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
  const [isSaved, setIsSaved]     = useState(false);
  const [showToast, setShowToast] = useState(false);

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
            <Bookmark size={10} className={isSaved ? "fill-[#D4AF37] text-[#D4AF37]" : "text-white"} />
          </button>
          <button
            onClick={handleShare}
            className="w-6 h-6 rounded-full bg-black/50 border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <Share2 size={10} className="text-white" />
          </button>
        </div>

        {/* Logo / initials — overlaps banner edge */}
        <div className="absolute bottom-0 left-4 translate-y-1/2 z-10">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={displayName}
              className="w-12 h-12 rounded-full border-2 border-[var(--card)] object-cover shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-[var(--card)] bg-blue-500/20 flex items-center justify-center shadow-md">
              {initials ? (
                <span className="text-sm font-semibold uppercase text-blue-300">{initials}</span>
              ) : (
                <Briefcase size={18} className="text-blue-300" strokeWidth={1.5} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-4 pt-9 pb-4">

        {/* Name + verified */}
        <div className="flex items-center gap-1 min-w-0 mb-0.5">
          <h2 className="text-sm font-semibold leading-tight truncate">{displayName}</h2>
          {business.is_verified && <VerifiedBadge type="business" className="shrink-0 mt-px" />}
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
            className="flex-1 flex items-center justify-center py-1.5 rounded-xl border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-semibold hover:bg-[#D4AF37]/[0.06] transition-colors"
          >
            View
          </Link>
        </div>
      </div>

      {/* Toast */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black px-4 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all duration-300 z-30 ${
          showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        Link copied!
      </div>
    </article>
  );
}
