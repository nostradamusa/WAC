"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Bookmark,
  Share2,
  Briefcase,
  UserPlus,
  GraduationCap,
  HandCoins,
  Users,
  MapPin,
  X,
} from "lucide-react";
import type { PersonDirectoryRow } from "@/lib/types/person-directory";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import FollowButton from "@/components/ui/FollowButton";

type DirectoryPerson = PersonDirectoryRow & {
  current_title?: string | null;
  company?: string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(p: DirectoryPerson) {
  return (p.full_name || p.username || "W")
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

function buildLocation(p: DirectoryPerson) {
  return [p.state?.trim(), abbrev(p.country)].filter(Boolean).join(", ");
}

function buildPrimary(p: DirectoryPerson) {
  return (
    p.headline?.trim() ||
    p.current_title?.trim() ||
    p.profession_name?.trim() ||
    p.profession?.trim() ||
    p.specialty_name?.trim() ||
    ""
  );
}

function buildRoots(p: DirectoryPerson) {
  const parts = [p.ancestry_village, p.ancestry_city, abbrev(p.ancestry_country)]
    .map((x) => x?.trim())
    .filter(Boolean);
  return [...new Set(parts)].join(", ");
}

// ── Badge config ───────────────────────────────────────────────────────────

const BADGE_CONFIG = [
  { key: "open_to_work",         urlParam: "work=true",   label: "Open to Work", Icon: Briefcase,     color: "bg-green-500/10 text-green-400 border-green-500/20"  },
  { key: "open_to_hire",         urlParam: "hire=true",   label: "Hiring",       Icon: UserPlus,      color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { key: "open_to_mentor",       urlParam: "mentor=true", label: "Mentoring",    Icon: GraduationCap, color: "bg-blue-500/10 text-blue-400 border-blue-500/20"       },
  { key: "open_to_invest",       urlParam: "invest=true", label: "Investing",    Icon: HandCoins,     color: "bg-amber-500/10 text-amber-400 border-amber-500/20"    },
  { key: "open_to_collaborate",  urlParam: "collab=true", label: "Collab",       Icon: Users,         color: "bg-rose-500/10 text-rose-400 border-rose-500/20"       },
] as const;

// ── Component ──────────────────────────────────────────────────────────────

export default function PersonCard({ person }: { person: DirectoryPerson }) {
  const [isSaved,          setIsSaved]          = useState(false);
  const [showToast,        setShowToast]        = useState(false);
  const [showAvatarModal,  setShowAvatarModal]  = useState(false);

  const displayName  = person.full_name || person.username || "Member";
  const profileHref  = person.username ? `/people/${person.username}` : "#";
  const initials     = getInitials(person);
  const primaryLine  = buildPrimary(person);
  const location     = buildLocation(person);
  const roots        = buildRoots(person);

  // @ts-expect-error banner_url occasionally present in real data
  const bannerUrl: string | null = person.banner_url ?? null;

  const badges = BADGE_CONFIG.filter((b) => !!(person as any)[b.key]);

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
        {bannerUrl ? (
          <>
            <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700/55 to-slate-800/45" />
        )}

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

      {/*
        Avatar — anchored to the article (not inside the banner overflow-hidden),
        bridging the banner/body boundary. z-20 ensures it paints above body content.
      */}
      <div className="absolute left-4 top-10 z-20">
        {person.avatar_url ? (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAvatarModal(true); }}
            className="block rounded-full hover:opacity-90 transition-opacity cursor-zoom-in"
            aria-label="View profile photo"
          >
            <img
              src={person.avatar_url}
              alt={displayName}
              className="w-12 h-12 rounded-full border-2 border-[var(--card)] object-cover shadow-md ring-1 ring-white/[0.12]"
            />
          </button>
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-[var(--card)] bg-white/[0.08] flex items-center justify-center text-sm font-semibold uppercase text-white/65 shadow-md ring-1 ring-white/[0.08]">
            {initials}
          </div>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-4 pt-14 pb-4">

        {/* Name + verified */}
        <div className="flex items-center gap-1 min-w-0 mb-0.5">
          <h2 className="text-sm font-semibold leading-tight truncate">{displayName}</h2>
          {person.is_verified && <VerifiedBadge size="sm" className="shrink-0 mt-px" />}
        </div>

        {/* Headline */}
        {primaryLine && (
          <p className="text-[11px] text-white/55 line-clamp-1 leading-snug">{primaryLine}</p>
        )}

        {/* Location + Roots */}
        {(location || roots) && (
          <div className="flex flex-wrap items-center gap-x-1.5 mt-0.5">
            {location && (
              <span className="flex items-center gap-0.5 text-[11px] text-white/35">
                <MapPin size={9} className="shrink-0" />
                {location}
              </span>
            )}
            {roots && (
              <span className="text-[11px] text-white/25">
                {location && "· "}Roots: {roots}
              </span>
            )}
          </div>
        )}

        {/* Skills */}
        {person.skills && person.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {person.skills.slice(0, 2).map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-[10px] text-white/50"
              >
                {s}
              </span>
            ))}
            {person.skills.length > 2 && (
              <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-[10px] text-white/30">
                +{person.skills.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Intent badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(() => {
              const { urlParam, label, Icon, color } = badges[0];
              return (
                <Link
                  href={`/directory?${urlParam}`}
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${color}`}
                >
                  <Icon size={10} /> {label}
                </Link>
              );
            })()}
            {badges.length > 1 && (
              <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-white/50">
                +{badges.length - 1}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-3" />

        {/* CTAs */}
        {person.username ? (
          <div className="flex gap-1.5 mt-3">
            <FollowButton followingType="person" followingId={person.id} size="sm" className="flex-1" />
            <Link
              href={profileHref}
              className="flex-1 flex items-center justify-center py-1.5 px-3 rounded-full bg-[#b08d57] text-black text-xs font-bold hover:bg-[#9a7545] transition-colors"
            >
              View
            </Link>
          </div>
        ) : (
          <div className="mt-3 h-8 rounded-full border border-white/[0.07] flex items-center justify-center text-[11px] text-white/25">
            Profile pending
          </div>
        )}
      </div>

      {/* Toast */}
      <div
        className={`absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#b08d57] text-black px-4 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all duration-300 z-30 ${
          showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        Link copied!
      </div>

      {/* Avatar lightbox — rendered in body portal to avoid transform clipping */}
      {showAvatarModal && person.avatar_url && createPortal(
        <div
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 cursor-pointer animate-in fade-in duration-150"
          onClick={() => setShowAvatarModal(false)}
        >
          <div className="relative max-w-[280px] w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={person.avatar_url}
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
