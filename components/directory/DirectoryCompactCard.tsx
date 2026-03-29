"use client";

import { memo } from "react";
import Link from "next/link";
import { User, Briefcase, Landmark, Calendar, UserPlus, MapPin } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import type { DirectoryRowKind } from "./DirectoryRow";

// ── Kind config ───────────────────────────────────────────────────────────────

const KIND_CONFIG: Record<
  DirectoryRowKind,
  {
    Icon: React.ElementType;
    avatarBg: string;
    avatarText: string;
    bannerGradient: string;
    followColor: string;
    entityLabel: string;
    labelColor: string;
  }
> = {
  person: {
    Icon: User,
    avatarBg: "bg-[#b08d57]/15",
    avatarText: "text-[#b08d57]/65",
    bannerGradient: "from-slate-700/50 via-slate-800/40 to-transparent",
    followColor: "border-[#b08d57]/35 text-[#b08d57]/85 hover:bg-[#b08d57]/10 hover:border-[#b08d57]/50",
    entityLabel: "Member",
    labelColor: "text-[#b08d57]/50",
  },
  business: {
    Icon: Briefcase,
    avatarBg: "bg-blue-500/15",
    avatarText: "text-blue-300/70",
    bannerGradient: "from-blue-900/35 via-slate-800/30 to-transparent",
    followColor: "border-blue-400/35 text-blue-400/85 hover:bg-blue-400/[0.07] hover:border-blue-400/50",
    entityLabel: "Business",
    labelColor: "text-blue-400/50",
  },
  organization: {
    Icon: Landmark,
    avatarBg: "bg-emerald-500/15",
    avatarText: "text-emerald-300/70",
    bannerGradient: "from-emerald-900/30 via-slate-800/30 to-transparent",
    followColor: "border-emerald-400/35 text-emerald-400/85 hover:bg-emerald-400/[0.07] hover:border-emerald-400/50",
    entityLabel: "Organization",
    labelColor: "text-emerald-400/50",
  },
  event: {
    Icon: Calendar,
    avatarBg: "bg-amber-500/15",
    avatarText: "text-amber-300/70",
    bannerGradient: "from-amber-900/30 via-slate-800/30 to-transparent",
    followColor: "border-amber-400/35 text-amber-400/85 hover:bg-amber-400/[0.07] hover:border-amber-400/50",
    entityLabel: "Event",
    labelColor: "text-amber-400/50",
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export type EntitySignal = {
  label: string;
  colorClass: string;
};

export type DirectoryCompactCardProps = {
  href: string;
  name: string;
  avatarUrl?: string | null;
  initials: string;
  entityKind: DirectoryRowKind;
  line2?: string;
  line3?: string;
  isVerified?: boolean;
  signal?: EntitySignal;
};

// ── Component ─────────────────────────────────────────────────────────────────

const DirectoryCompactCard = memo(function DirectoryCompactCard({
  href,
  name,
  avatarUrl,
  initials,
  entityKind,
  line2,
  line3,
  isVerified,
  signal,
}: DirectoryCompactCardProps) {
  const {
    Icon,
    avatarBg,
    avatarText,
    bannerGradient,
    followColor,
    entityLabel,
    labelColor,
  } = KIND_CONFIG[entityKind];

  return (
    <Link
      href={href}
      className="wac-card group overflow-hidden p-0 flex flex-col relative active:scale-[0.98] hover:border-white/[0.10] transition-all duration-150 min-h-[196px]"
    >
      {/* ── Banner ─────────────────────────────────────────────────── */}
      <div className={`h-[46px] shrink-0 bg-gradient-to-br ${bannerGradient}`} />

      {/* ── Avatar ─────────────────────────────────────────────────── */}
      <div className="absolute left-3 top-[22px] z-10">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            loading="lazy"
            className="w-[42px] h-[42px] rounded-full border-2 border-[var(--card)] object-cover shadow-md ring-1 ring-white/[0.07]"
          />
        ) : (
          <div
            className={`w-[42px] h-[42px] rounded-full border-2 border-[var(--card)] ${avatarBg} flex items-center justify-center shadow-md ring-1 ring-white/[0.07]`}
          >
            {initials ? (
              <span className={`text-[11px] font-bold uppercase tracking-wide ${avatarText}`}>
                {initials}
              </span>
            ) : (
              <Icon size={13} className={avatarText} strokeWidth={1.8} />
            )}
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-3.5 pt-[26px] pb-3.5">

        {/* Entity type label */}
        <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${labelColor} block mb-1`}>
          {entityLabel}
        </span>

        {/* Name + verified */}
        <p
          className="text-[13px] font-bold text-white/88 leading-snug line-clamp-2 group-hover:text-white transition-colors duration-150 mb-0.5 min-w-0 pr-0.5"
          title={name}
        >
          {name}
          {isVerified && (
            <span className="inline-flex align-middle ml-1 -mt-px">
              <VerifiedBadge size="sm" />
            </span>
          )}
        </p>

        {/* Subtitle / headline */}
        {line2 && (
          <p className="text-[11px] text-white/40 line-clamp-1 leading-snug">
            {line2}
          </p>
        )}

        {/* Push everything below to bottom */}
        <div className="flex-1 min-h-[12px]" />

        {/* Location */}
        {line3 && (
          <div className="flex items-center gap-1 mb-2.5">
            <MapPin size={9} className="text-white/22 shrink-0" strokeWidth={1.5} />
            <p className="text-[10px] text-white/30 truncate">{line3}</p>
          </div>
        )}

        {/* Signal chip — appears above Follow when present */}
        {signal && (
          <span
            className={`self-start inline-flex items-center px-1.5 py-[3px] rounded-sm text-[9px] font-bold uppercase tracking-wide mb-2 ${signal.colorClass}`}
          >
            {signal.label}
          </span>
        )}

        {/* Follow CTA — full width */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={`w-full flex items-center justify-center gap-1 py-[7px] rounded-full border text-[10px] font-semibold uppercase tracking-wide transition-colors ${followColor}`}
        >
          <UserPlus size={10} strokeWidth={2} />
          Follow
        </button>

      </div>
    </Link>
  );
});

export default DirectoryCompactCard;
