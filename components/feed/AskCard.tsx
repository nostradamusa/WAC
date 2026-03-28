"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  HelpCircle,
  MapPin,
  MessageCircle,
  Building2,
  Landmark,
  Zap,
} from "lucide-react";
import { NetworkPost } from "@/lib/types/network-feed";
import { getCategoryLabel } from "@/lib/constants/askConstants";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import PulsePostViewer from "./PulsePostViewer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds / 31536000 > 1) return Math.floor(seconds / 31536000) + "y";
  if (seconds / 2592000  > 1) return Math.floor(seconds / 2592000)  + "mo";
  if (seconds / 86400    > 1) return Math.floor(seconds / 86400)    + "d";
  if (seconds / 3600     > 1) return Math.floor(seconds / 3600)     + "h";
  if (seconds / 60       > 1) return Math.floor(seconds / 60)       + "m";
  return "now";
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { dot: string; label: string }> = {
  open:     { dot: "bg-emerald-400",  label: "Open"     },
  answered: { dot: "bg-amber-400",    label: "Answered" },
  solved:   { dot: "bg-white/25",     label: "Solved"   },
};

// ─── Urgency config ───────────────────────────────────────────────────────────

const URGENCY_CONFIG: Record<string, { cls: string; label: string } | undefined> = {
  soon:   { cls: "text-amber-400/80 bg-amber-500/10 border-amber-500/20",   label: "Soon"   },
  urgent: { cls: "text-rose-400/80  bg-rose-500/10  border-rose-500/20",    label: "Urgent" },
};

// ─── AskCard ──────────────────────────────────────────────────────────────────

export default function AskCard({ post }: { post: NetworkPost }) {
  const [viewerOpen, setViewerOpen] = useState(false);

  // ── Author resolution (mirrors PostCard) ──────────────────────────────────
  let authorName     = "Unknown";
  let authorAvatar: string | null = null;
  let authorHeadline = "";
  let authorLink     = "#";
  let isVerified     = false;
  let isEntity       = false;

  if (post.author_profile) {
    authorName     = post.author_profile.full_name || "Member";
    authorAvatar   = post.author_profile.avatar_url;
    authorHeadline = post.author_profile.headline || "";
    authorLink     = post.author_profile.username ? `/people/${post.author_profile.username}` : "#";
    isVerified     = post.author_profile.is_verified;
  } else if (post.author_business) {
    authorName     = post.author_business.name;
    authorAvatar   = post.author_business.logo_url;
    authorHeadline = post.author_business.business_type || "Business";
    authorLink     = `/businesses/${post.author_business.slug}`;
    isVerified     = post.author_business.is_verified;
    isEntity       = true;
  } else if (post.author_organization) {
    authorName     = post.author_organization.name;
    authorAvatar   = post.author_organization.logo_url;
    authorHeadline = post.author_organization.organization_type || "Organization";
    authorLink     = `/organizations/${post.author_organization.slug}`;
    isVerified     = post.author_organization.is_verified;
    isEntity       = true;
  }

  const categoryLabel = getCategoryLabel(post.ask_category);
  const status        = STATUS_CONFIG[post.ask_status ?? "open"] ?? STATUS_CONFIG.open;
  const urgency       = URGENCY_CONFIG[post.ask_urgency ?? "normal"];
  const responseCount = post.comments_count ?? 0;

  return (
    <>
      {/* ── Card ─────────────────────────────────────────────────────────────── */}
      <div
        className="relative border-b border-white/[0.07] px-4 pt-4 pb-3 cursor-pointer group"
        onClick={() => setViewerOpen(true)}
      >
        {/* Gold left accent on the inner ask block */}
        <div className="border-l-2 border-[#b08d57]/50 pl-3 ml-[52px]">

          {/* ── Author row ─────────────────────────────────────────────────── */}
          <div className="flex items-start gap-3 -ml-3 mb-3">
            {/* Avatar */}
            <Link
              href={authorLink}
              onClick={(e) => e.stopPropagation()}
              className={`relative shrink-0 overflow-hidden bg-white/[0.05] border border-white/[0.10] hover:border-[#b08d57]/40 transition-colors ${
                isEntity ? "w-10 h-10 rounded-xl" : "w-10 h-10 rounded-full"
              }`}
            >
              {authorAvatar ? (
                <Image src={authorAvatar} alt={authorName} fill sizes="40px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-[#b08d57] text-sm">
                  {authorName.charAt(0)}
                </div>
              )}
            </Link>

            {/* Name / headline / time */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={authorLink}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-sm text-white hover:text-[#b08d57] transition-colors leading-tight truncate"
                >
                  {authorName}
                </Link>
                {isVerified && <VerifiedBadge size="sm" className="shrink-0" />}
                {post.author_organization && (
                  <Landmark size={10} className="text-white/30 shrink-0" />
                )}
                {post.author_business && (
                  <Building2 size={10} className="text-white/30 shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-white/38 leading-snug truncate mt-0.5">
                {authorHeadline && `${authorHeadline} · `}{timeAgo(post.created_at)}
              </p>
            </div>

            {/* ASK badge */}
            <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-[#b08d57]/10 border border-[#b08d57]/25">
              <HelpCircle size={9} strokeWidth={2.5} className="text-[#b08d57]/70" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#b08d57]/80">Ask</span>
            </div>
          </div>

          {/* ── Meta row: category · location · urgency ────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            {categoryLabel && (
              <span className="text-[10px] font-semibold text-[#b08d57]/70 bg-[#b08d57]/[0.07] px-2 py-0.5 rounded-full border border-[#b08d57]/15">
                {categoryLabel}
              </span>
            )}
            {post.ask_location && (
              <span className="flex items-center gap-1 text-[10px] text-white/35">
                <MapPin size={9} strokeWidth={2} />
                {post.ask_location}
              </span>
            )}
            {urgency && (
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${urgency.cls}`}>
                <Zap size={9} strokeWidth={2.5} />
                {urgency.label}
              </span>
            )}
          </div>

          {/* ── Ask title ──────────────────────────────────────────────────── */}
          {post.ask_title && (
            <p className="text-[15px] font-semibold text-white/90 leading-snug mb-1.5 group-hover:text-white transition-colors">
              {post.ask_title}
            </p>
          )}

          {/* ── Ask body ───────────────────────────────────────────────────── */}
          {post.content && (
            <p className="text-[13px] text-white/60 leading-relaxed line-clamp-3 mb-3">
              {post.content}
            </p>
          )}

          {/* ── Footer row: status · responses · respond CTA ───────────────── */}
          <div className="flex items-center gap-3 pt-0.5">
            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
              <span className="text-[10px] text-white/35 font-medium">{status.label}</span>
            </div>

            {/* Response count */}
            <div className="flex items-center gap-1 text-[10px] text-white/30">
              <MessageCircle size={10} strokeWidth={1.8} />
              <span>
                {responseCount === 0
                  ? "No responses yet"
                  : `${responseCount} ${responseCount === 1 ? "response" : "responses"}`}
              </span>
            </div>

            {/* Respond CTA */}
            <button
              onClick={(e) => { e.stopPropagation(); setViewerOpen(true); }}
              className="ml-auto text-[11px] font-semibold text-[#b08d57]/70 hover:text-[#b08d57] transition-colors px-3 py-1 rounded-full border border-[#b08d57]/20 hover:border-[#b08d57]/40 hover:bg-[#b08d57]/[0.05]"
            >
              Respond
            </button>
          </div>

        </div>
      </div>

      {/* ── Viewer ───────────────────────────────────────────────────────────── */}
      {viewerOpen && (
        <PulsePostViewer post={post} onClose={() => setViewerOpen(false)} />
      )}
    </>
  );
}
