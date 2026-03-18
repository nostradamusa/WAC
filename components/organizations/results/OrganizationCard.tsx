"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Share2, Landmark, MapPin } from "lucide-react";
import type { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
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

function buildLocation(o: OrganizationDirectoryEntry) {
  return [o.city?.trim(), o.state?.trim(), abbrev(o.country)].filter(Boolean).join(", ");
}

// ── Component ────────────────────────────────────────────────────────────────

export default function OrganizationCard({ organization }: { organization: OrganizationDirectoryEntry }) {
  const [isSaved, setIsSaved]     = useState(false);
  const [showToast, setShowToast] = useState(false);

  const displayName  = organization.name;
  const profileHref  = `/organizations/${organization.slug}`;
  const initials     = getInitials(displayName);
  const subtitle     = organization.organization_type?.trim() || "";
  const location     = buildLocation(organization);

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
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800/45 to-slate-800/45" />

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
          {organization.logo_url ? (
            <img
              src={organization.logo_url}
              alt={displayName}
              className="w-12 h-12 rounded-full border-2 border-[var(--card)] object-cover shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-full border-2 border-[var(--card)] bg-emerald-500/20 flex items-center justify-center shadow-md">
              {initials ? (
                <span className="text-sm font-semibold uppercase text-emerald-300">{initials}</span>
              ) : (
                <Landmark size={18} className="text-emerald-300" strokeWidth={1.5} />
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
          {organization.is_verified && <VerifiedBadge type="organization" className="shrink-0 mt-px" />}
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

        {/* Leader */}
        {organization.leader_name && (
          <p className="text-[11px] text-white/25 mt-0.5 truncate">
            Led by {organization.leader_name}
          </p>
        )}

        {/* Description */}
        {organization.description && (
          <p className="text-[11px] text-white/30 line-clamp-2 leading-snug mt-2">
            {organization.description}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-3" />

        {/* CTAs */}
        <div className="flex gap-1.5 mt-3">
          <FollowButton followingType="organization" followingId={organization.id} size="sm" className="flex-1" />
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
