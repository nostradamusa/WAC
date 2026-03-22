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
  }
> = {
  person: {
    Icon: User,
    avatarBg: "bg-white/[0.10]",
    avatarText: "text-white/60",
    bannerGradient: "from-slate-700/60 to-slate-800/50",
    followColor: "border-[#b08d57]/40 text-[#b08d57] hover:bg-[#b08d57]/[0.08]",
  },
  business: {
    Icon: Briefcase,
    avatarBg: "bg-blue-500/20",
    avatarText: "text-blue-300",
    bannerGradient: "from-blue-900/40 to-slate-800/50",
    followColor: "border-blue-400/40 text-blue-400 hover:bg-blue-400/[0.08]",
  },
  organization: {
    Icon: Landmark,
    avatarBg: "bg-emerald-500/20",
    avatarText: "text-emerald-300",
    bannerGradient: "from-emerald-900/35 to-slate-800/50",
    followColor: "border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/[0.08]",
  },
  event: {
    Icon: Calendar,
    avatarBg: "bg-[#b08d57]/15",
    avatarText: "text-[#b08d57]/70",
    bannerGradient: "from-amber-900/35 to-slate-800/50",
    followColor: "border-[#b08d57]/40 text-[#b08d57] hover:bg-[#b08d57]/[0.08]",
  },
};

// ── Props ─────────────────────────────────────────────────────────────────────

export type DirectoryCompactCardProps = {
  href: string;
  name: string;
  avatarUrl?: string | null;
  initials: string;
  entityKind: DirectoryRowKind;
  /** Subtitle: role, profession, entity type */
  line2?: string;
  /** Location or short descriptor */
  line3?: string;
  isVerified?: boolean;
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
}: DirectoryCompactCardProps) {
  const { Icon, avatarBg, avatarText, bannerGradient, followColor } = KIND_CONFIG[entityKind];

  return (
    <Link
      href={href}
      className="wac-card group overflow-hidden p-0 flex flex-col relative active:scale-[0.98] transition-transform"
    >
      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <div className={`h-8 shrink-0 bg-gradient-to-br ${bannerGradient}`} />

      {/* ── Avatar — bridges banner / body ─────────────────────────────── */}
      <div className="absolute left-2.5 top-4 z-10">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            loading="lazy"
            className="w-9 h-9 rounded-full border-2 border-[var(--card)] object-cover shadow ring-1 ring-white/[0.10]"
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-full border-2 border-[var(--card)] ${avatarBg} flex items-center justify-center shadow ring-1 ring-white/[0.08]`}
          >
            {initials ? (
              <span className={`text-[10px] font-bold uppercase leading-none ${avatarText}`}>
                {initials}
              </span>
            ) : (
              <Icon size={13} className={avatarText} strokeWidth={1.5} />
            )}
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-2.5 pt-6 pb-2.5">

        {/* Name + verified */}
        <div className="flex items-center gap-0.5 min-w-0 mb-px">
          <span className="text-[11px] font-semibold text-white leading-tight truncate group-hover:text-white/90">
            {name}
          </span>
          {isVerified && <VerifiedBadge size="xs" className="shrink-0" />}
        </div>

        {/* Subtitle */}
        {line2 && (
          <p className="text-[10px] text-white/45 truncate leading-snug">{line2}</p>
        )}

        {/* Location */}
        {line3 && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <MapPin size={8} className="text-white/25 shrink-0" />
            <p className="text-[10px] text-white/30 truncate leading-snug">{line3}</p>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-2" />

        {/* Follow button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={`mt-2 w-full flex items-center justify-center gap-1 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide transition-colors ${followColor}`}
        >
          <UserPlus size={9} strokeWidth={2.5} />
          Follow
        </button>
      </div>
    </Link>
  );
});

export default DirectoryCompactCard;
