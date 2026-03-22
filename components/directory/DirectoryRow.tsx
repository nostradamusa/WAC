"use client";

import { memo } from "react";
import Link from "next/link";
import { User, Briefcase, Landmark, Calendar } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

export type DirectoryRowKind = "person" | "business" | "organization" | "event";

const KIND_CONFIG: Record<
  DirectoryRowKind,
  {
    Icon: React.ElementType;
    avatarBg: string;
    avatarText: string;
    actionLabel: string;
    actionClass: string;
  }
> = {
  person: {
    Icon: User,
    avatarBg: "bg-white/[0.08]",
    avatarText: "text-white/65",
    actionLabel: "Connect",
    actionClass: "border-[#b08d57]/35 text-[#b08d57] hover:bg-[#b08d57]/[0.06]",
  },
  business: {
    Icon: Briefcase,
    avatarBg: "bg-blue-500/20",
    avatarText: "text-blue-300",
    actionLabel: "Follow",
    actionClass: "border-blue-400/35 text-blue-400 hover:bg-blue-400/[0.06]",
  },
  organization: {
    Icon: Landmark,
    avatarBg: "bg-emerald-500/20",
    avatarText: "text-emerald-300",
    actionLabel: "Follow",
    actionClass: "border-emerald-400/35 text-emerald-400 hover:bg-emerald-400/[0.06]",
  },
  event: {
    Icon: Calendar,
    avatarBg: "bg-[#b08d57]/15",
    avatarText: "text-[#b08d57]/70",
    actionLabel: "RSVP",
    actionClass: "border-[#b08d57]/35 text-[#b08d57] hover:bg-[#b08d57]/[0.06]",
  },
};

export type DirectoryRowProps = {
  href: string;
  name: string;
  avatarUrl?: string | null;
  initials: string;
  entityKind: DirectoryRowKind;
  /** Subtitle: role, category, entity type */
  line2?: string;
  /** Tertiary: location or short descriptor */
  line3?: string;
  isVerified?: boolean;
};

const DirectoryRow = memo(function DirectoryRow({
  href,
  name,
  avatarUrl,
  initials,
  entityKind,
  line2,
  line3,
  isVerified,
}: DirectoryRowProps) {
  const { Icon, avatarBg, avatarText, actionLabel, actionClass } = KIND_CONFIG[entityKind];

  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0 active:bg-white/[0.02] transition-colors group"
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full shrink-0 ${avatarBg} flex items-center justify-center overflow-hidden`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : initials ? (
          <span className={`text-xs font-bold uppercase leading-none ${avatarText}`}>{initials}</span>
        ) : (
          <Icon size={16} className={avatarText} strokeWidth={1.5} />
        )}
      </div>

      {/* Text block */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-sm font-semibold text-white leading-tight truncate group-hover:text-white/90">
            {name}
          </span>
          {isVerified && <VerifiedBadge size="xs" className="shrink-0" />}
        </div>
        {line2 && (
          <p className="text-xs text-white/45 truncate mt-0.5 leading-tight">{line2}</p>
        )}
        {line3 && (
          <p className="text-[11px] text-white/28 truncate leading-tight">{line3}</p>
        )}
      </div>

      {/* Action */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={`shrink-0 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide transition-colors ${actionClass}`}
      >
        {actionLabel}
      </button>
    </Link>
  );
});

export default DirectoryRow;
