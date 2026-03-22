"use client";

import Link from "next/link";
import { Briefcase, Landmark, Calendar, User } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

export type EntityKind = "person" | "business" | "organization" | "event";

const KIND_ICON: Record<EntityKind, React.ElementType> = {
  person:       User,
  business:     Briefcase,
  organization: Landmark,
  event:        Calendar,
};

export type CompactRailCardProps = {
  href: string;
  name: string;
  avatarUrl?: string | null;
  /** Two-letter initials shown when no avatarUrl */
  initials: string;
  /** Short supporting line — headline, category, city, or date */
  supportingLine?: string;
  /** Tailwind gradient/bg classes for the shallow banner */
  bannerClass: string;
  /** Tailwind bg class for the initials/icon circle */
  avatarBgClass: string;
  /** Tailwind text-color class for initials / icon */
  avatarTextClass: string;
  /** Entity kind — used to pick the fallback icon when initials is empty */
  entityKind?: EntityKind;
  isVerified?: boolean;
};

export default function CompactRailCard({
  href,
  name,
  avatarUrl,
  initials,
  supportingLine,
  bannerClass,
  avatarBgClass,
  avatarTextClass,
  entityKind,
  isVerified,
}: CompactRailCardProps) {
  const FallbackIcon = entityKind ? KIND_ICON[entityKind] : null;
  return (
    <Link
      href={href}
      className="wac-card group shrink-0 w-[112px] overflow-hidden p-0 flex flex-col hover:-translate-y-0.5 transition-transform active:scale-[0.97]"
    >
      {/* ── Banner ──────────────────────────────────────────────────────── */}
      <div className={`relative h-9 shrink-0 overflow-hidden ${bannerClass}`}>
        {/* Avatar — overlaps banner bottom edge */}
        <div className="absolute bottom-0 left-2 translate-y-1/2 z-10">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-7 h-7 rounded-full border border-[var(--card)] object-cover shadow-sm"
            />
          ) : (
            <div
              className={`w-7 h-7 rounded-full border border-[var(--card)] ${avatarBgClass} flex items-center justify-center shadow-sm`}
            >
              {initials ? (
                <span className={`text-[9px] font-bold uppercase leading-none ${avatarTextClass}`}>
                  {initials}
                </span>
              ) : FallbackIcon ? (
                <FallbackIcon size={12} className={avatarTextClass} strokeWidth={1.5} />
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col px-2 pt-[17px] pb-2.5 min-w-0">
        {/* Name row */}
        <div className="flex items-center gap-0.5 min-w-0">
          <span className="text-[11px] font-semibold text-white leading-tight truncate">{name}</span>
          {isVerified && <VerifiedBadge size="xs" className="shrink-0 opacity-80" />}
        </div>

        {/* Supporting line */}
        {supportingLine && (
          <span className="text-[10px] text-white/40 truncate mt-0.5 leading-tight">
            {supportingLine}
          </span>
        )}
      </div>
    </Link>
  );
}
