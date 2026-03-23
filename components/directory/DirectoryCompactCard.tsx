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
    followColor: "border-[#b08d57]/40 text-[#b08d57] hover:bg-[#b08d57]/10",
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
  line2?: string;
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
      className="wac-card group overflow-hidden p-0 flex flex-col relative active:scale-[0.98] transition-transform min-h-[180px]"
    >
      {/* ── Taller Banner ──────────────────────────────────────────────── */}
      <div className={`h-12 shrink-0 bg-gradient-to-br ${bannerGradient}`} />

      {/* ── Larger Avatar ──────────────────────────────────────────────── */}
      <div className="absolute left-3 top-6 z-10">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            loading="lazy"
            className="w-11 h-11 rounded-full border-[2.5px] border-[var(--card)] object-cover shadow-md ring-1 ring-white/[0.08]"
          />
        ) : (
          <div
            className={`w-11 h-11 rounded-full border-[2.5px] border-[var(--card)] ${avatarBg} flex items-center justify-center shadow-md ring-1 ring-white/[0.08]`}
          >
            {initials ? (
              <span className={`text-[11px] font-bold uppercase tracking-wider ${avatarText}`}>
                {initials}
              </span>
            ) : (
              <Icon size={14} className={avatarText} strokeWidth={2} />
            )}
          </div>
        )}
      </div>

      {/* ── Spaced Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-3 pt-7 pb-3.5">

        {/* Name + verified wraps smoothly instead of truncating immediately */}
        <div className="flex items-start gap-1 justify-between min-w-0 mb-1.5">
          <span className="text-xs font-bold text-white/90 leading-snug line-clamp-2 group-hover:text-white transition-colors">
            {name}
          </span>
          {isVerified && <VerifiedBadge size="sm" className="shrink-0 mt-[1px]" />}
        </div>

        {/* Subtitle / Role (Allowed to breathe 2 lines) */}
        {line2 && (
          <p className="text-[11px] font-medium text-white/50 line-clamp-2 leading-relaxed">
            {line2}
          </p>
        )}

        <div className="flex-1 min-h-[12px]" />

        {/* Location anchoring */}
        {line3 && (
          <div className="flex items-center gap-1 mb-3">
            <MapPin size={10} className="text-white/30 shrink-0" />
            <p className="text-[10px] text-white/40 truncate font-medium">{line3}</p>
          </div>
        )}

        {/* Chunkier Follow CTA */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={`mt-auto w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-widest transition-colors ${followColor}`}
        >
          <UserPlus size={12} strokeWidth={2.5} />
          Follow
        </button>
      </div>
    </Link>
  );
});

export default DirectoryCompactCard;
