"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Network,
  ChevronLeft,
  Users,
  Globe,
  Lock,
  EyeOff,
  DoorOpen,
  UserCheck,
  Mail,
  Pin,
  Heart,
  MessageCircle,
  Share2,
  CalendarDays,
  MapPin,
  Clock,
  Image,
  Video,
  FileText,
  FileSpreadsheet,
  File,
  Download,
  Upload,
  Crown,
  Shield,
  Search,
} from "lucide-react";
import type { GroupData, GroupMemberRole, GroupPost, GroupEvent, GroupMedia, GroupFile, GroupMember } from "@/lib/types/group";
import SectionLabel from "@/components/ui/SectionLabel";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = "about" | "discussion" | "members" | "events" | "media" | "files";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatFileSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function privacyLabel(p: GroupData["privacy"]): string {
  return { public: "Public", private: "Private", secret: "Secret" }[p];
}

function joinPolicyLabel(j: GroupData["join_policy"]): string {
  return { open: "Open to All", request: "Request to Join", invite_only: "Invite Only" }[j];
}

function PrivacyIcon({ privacy }: { privacy: GroupData["privacy"] }) {
  const cls = "shrink-0 text-white/35";
  if (privacy === "public")  return <Globe   size={12} className={cls} strokeWidth={1.8} />;
  if (privacy === "private") return <Lock    size={12} className={cls} strokeWidth={1.8} />;
  return                            <EyeOff  size={12} className={cls} strokeWidth={1.8} />;
}

function JoinIcon({ policy }: { policy: GroupData["join_policy"] }) {
  const cls = "shrink-0 text-white/35";
  if (policy === "open")         return <DoorOpen   size={12} className={cls} strokeWidth={1.8} />;
  if (policy === "request")      return <UserCheck  size={12} className={cls} strokeWidth={1.8} />;
  return                                <Mail       size={12} className={cls} strokeWidth={1.8} />;
}

function RoleBadge({ role }: { role: GroupMemberRole }) {
  if (role === "owner") return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#b08d57]/15 border border-[#b08d57]/25 text-[9px] font-bold text-[#b08d57] uppercase tracking-wide">
      <Crown size={8} />Owner
    </span>
  );
  if (role === "admin") return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.10] text-[9px] font-bold text-white/55 uppercase tracking-wide">
      <Shield size={8} />Admin
    </span>
  );
  if (role === "moderator") return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-[9px] font-bold text-white/40 uppercase tracking-wide">
      Mod
    </span>
  );
  return null;
}

function FileTypeIcon({ type }: { type: string }) {
  const cls = "shrink-0 text-white/40";
  const t   = type.toUpperCase();
  if (t === "PDF")              return <FileText        size={18} className={cls} strokeWidth={1.6} />;
  if (t === "XLSX" || t === "CSV") return <FileSpreadsheet size={18} className={cls} strokeWidth={1.6} />;
  return                               <File            size={18} className={cls} strokeWidth={1.6} />;
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function GroupHero({
  group,
  currentUserRole,
  onJoinRequest,
}: {
  group:            GroupData;
  currentUserRole:  GroupMemberRole | null;
  onJoinRequest:    () => void;
}) {
  const ctaLabel =
    group.join_policy === "open"         ? "Join Group"        :
    group.join_policy === "request"      ? "Request to Join"   :
                                           "Apply for Invite";

  return (
    <div className="pb-8 border-b border-white/[0.06]">

      {/* Banner */}
      {group.banner_url ? (
        <div className="relative w-full h-36 sm:h-48 overflow-hidden">
          <img src={group.banner_url} alt="Group banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--background)]" />
        </div>
      ) : (
        <div className="pt-20 md:pt-24" />
      )}

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">

        {/* Back link */}
        <Link
          href="/groups"
          className={`inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-6 ${group.banner_url ? "mt-4" : ""}`}
        >
          <ChevronLeft size={14} strokeWidth={2} />
          Groups
        </Link>

        {/* Identity block */}
        <div className="flex flex-col sm:flex-row items-start gap-5">

          {/* Avatar */}
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shrink-0 border border-white/[0.06] overflow-hidden ${!group.avatar_url ? `flex items-center justify-center font-bold text-lg sm:text-xl ${group.avatar_bg} ${group.avatar_color}` : ""}`}
          >
            {group.avatar_url ? (
              <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(group.name)
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">

            {/* Eyebrow */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <Network size={11} className="text-white/30" strokeWidth={2} />
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/35">
                {group.category}
              </span>
            </div>

            {/* Name */}
            <h1 className="font-serif text-2xl md:text-3xl font-normal text-white leading-tight mb-2">
              {group.name}
            </h1>

            {/* Description */}
            <p className="text-sm text-white/55 leading-relaxed max-w-2xl mb-4">
              {group.description}
            </p>

            {/* Metadata chips */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-[11px] text-white/50">
                <PrivacyIcon privacy={group.privacy} />
                {privacyLabel(group.privacy)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-[11px] text-white/50">
                <JoinIcon policy={group.join_policy} />
                {joinPolicyLabel(group.join_policy)}
              </span>
              {group.location_relevance && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-[11px] text-white/50">
                  <Globe size={11} className="shrink-0 text-white/35" strokeWidth={1.8} />
                  {group.location_relevance}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-[11px] text-white/35 mb-3">
              <span className="flex items-center gap-1">
                <Users size={12} strokeWidth={1.8} />
                {group.member_count} members
              </span>
              <span className="text-white/15">·</span>
              <span>{group.activity_summary}</span>
            </div>

            {/* Parent org */}
            {group.parent_org_name && group.parent_org_slug && (
              <p className="text-[11px] text-white/35 mb-3">
                Part of{" "}
                <Link
                  href={`/organizations/${group.parent_org_slug}`}
                  className="text-[#b08d57]/70 hover:text-[#b08d57] transition-colors"
                >
                  {group.parent_org_name}
                </Link>
              </p>
            )}

            {/* Tags */}
            {group.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {group.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-white/30 px-2 py-0.5 rounded-full border border-white/[0.07]">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA row */}
        <div className="mt-6 flex items-center gap-3">
          {currentUserRole === "owner" ? (
            <>
              <Link
                href={`/groups/${group.slug}/settings`}
                className="whitespace-nowrap px-6 py-2.5 rounded-full bg-[#b08d57] text-black text-sm font-bold hover:bg-[#9a7545] transition-colors"
              >
                Manage Group
              </Link>
              <button className="whitespace-nowrap px-4 py-2 rounded-full border border-white/[0.10] text-xs font-medium text-white/45 hover:text-white/70 hover:border-white/20 transition-colors">
                Invite Members
              </button>
              <button className="p-2 rounded-full border border-white/[0.10] text-white/35 hover:text-white/65 hover:border-white/20 transition-colors">
                <Share2 size={14} strokeWidth={1.8} />
              </button>
            </>
          ) : currentUserRole === "admin" || currentUserRole === "moderator" || group.is_member ? (
            <>
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.10] text-xs font-semibold text-white/60">
                ✓ Joined
              </span>
              {(currentUserRole === "admin") && (
                <button className="px-4 py-2 rounded-full border border-white/[0.10] text-xs font-medium text-white/45 hover:text-white/70 hover:border-white/20 transition-colors">
                  Invite Members
                </button>
              )}
              <button className="p-2 rounded-full border border-white/[0.10] text-white/35 hover:text-white/65 hover:border-white/20 transition-colors">
                <Share2 size={14} strokeWidth={1.8} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onJoinRequest}
                className="px-6 py-2.5 rounded-full bg-[#b08d57] text-black text-sm font-bold hover:bg-[#9a7545] transition-colors"
              >
                {ctaLabel}
              </button>
              <button className="p-2 rounded-full border border-white/[0.10] text-white/35 hover:text-white/65 hover:border-white/20 transition-colors">
                <Share2 size={14} strokeWidth={1.8} />
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Tab nav ───────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "about",      label: "About"      },
  { id: "discussion", label: "Discussion" },
  { id: "members",    label: "Members"    },
  { id: "events",     label: "Events"     },
  { id: "media",      label: "Media"      },
  { id: "files",      label: "Files"      },
];

function GroupTabNav({
  activeTab,
  onTabChange,
}: {
  activeTab:   TabId;
  onTabChange: (t: TabId) => void;
}) {
  return (
    <div className="sticky top-[65px] z-30 bg-[var(--background)]/95 backdrop-blur-sm border-b border-white/[0.06]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div
          className="flex items-center gap-1 overflow-x-auto"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`shrink-0 px-4 py-3.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-[1px] ${
                activeTab === tab.id
                  ? "border-[#b08d57] text-[#b08d57]"
                  : "border-transparent text-white/45 hover:text-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── About tab ─────────────────────────────────────────────────────────────────

function AboutTab({ group }: { group: GroupData }) {
  const leadership = group.members.filter(m => m.role === "owner" || m.role === "admin" || m.role === "moderator");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

      {/* Left: description + rules */}
      <div className="md:col-span-2 space-y-8">

        {/* About */}
        <section>
          <SectionLabel label="About this Group" variant="featured" className="mb-4" />
          <p className="text-sm text-white/65 leading-relaxed">
            {group.description}
          </p>
        </section>

        {/* Community guidelines */}
        {group.rules.length > 0 && (
          <section>
            <SectionLabel label="Community Guidelines" variant="standard" className="mb-4" />
            <div className="space-y-3">
              {group.rules.map((rule, idx) => (
                <div key={rule.id} className="flex gap-4 p-4 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#b08d57]/10 border border-[#b08d57]/20 flex items-center justify-center text-[10px] font-bold text-[#b08d57]/70">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white/75 mb-0.5">{rule.title}</p>
                    <p className="text-[12px] text-white/40 leading-relaxed">{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Right: details + admins */}
      <div className="space-y-6">

        {/* Group details */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/35 mb-4">Group Details</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">Privacy</span>
              <span className="flex items-center gap-1.5 text-[11px] text-white/65">
                <PrivacyIcon privacy={group.privacy} />
                {privacyLabel(group.privacy)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">Joining</span>
              <span className="flex items-center gap-1.5 text-[11px] text-white/65">
                <JoinIcon policy={group.join_policy} />
                {joinPolicyLabel(group.join_policy)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">Members</span>
              <span className="text-[11px] text-white/65">{group.member_count}</span>
            </div>
            {group.location_relevance && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/40">Location</span>
                <span className="text-[11px] text-white/65">{group.location_relevance}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">Created</span>
              <span className="text-[11px] text-white/65">{formatDate(group.created_at)}</span>
            </div>
            {group.tags.length > 0 && (
              <div className="pt-1 border-t border-white/[0.06]">
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {group.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-white/30 px-2 py-0.5 rounded-full border border-white/[0.07]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Parent org */}
        {group.parent_org_name && group.parent_org_slug && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/35 mb-3">Parent Organization</p>
            <Link
              href={`/organizations/${group.parent_org_slug}`}
              className="flex items-center gap-3 group"
            >
              <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[10px] font-bold text-white/40">
                {getInitials(group.parent_org_name)}
              </div>
              <span className="text-sm font-medium text-white/65 group-hover:text-[#b08d57] transition-colors">
                {group.parent_org_name}
              </span>
            </Link>
          </div>
        )}

        {/* Admins */}
        {leadership.length > 0 && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/35 mb-4">Leadership</p>
            <div className="space-y-3">
              {leadership.map(m => (
                <Link key={m.id} href={`/people/${m.username}`} className="flex items-center gap-3 group">
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                    m.role === "owner"
                      ? "bg-[#b08d57]/15 text-[#b08d57] border border-[#b08d57]/20"
                      : "bg-white/[0.05] text-white/50 border border-white/[0.08]"
                  }`}>
                    {getInitials(m.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white/70 group-hover:text-[#b08d57] transition-colors truncate">
                      {m.full_name}
                    </p>
                    {m.headline && (
                      <p className="text-[10px] text-white/35 truncate">{m.headline}</p>
                    )}
                  </div>
                  <RoleBadge role={m.role} />
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Discussion tab ────────────────────────────────────────────────────────────

function PostCard({ post, isMember }: { post: GroupPost; isMember: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${
      post.is_pinned
        ? "border-[#b08d57]/20 bg-[#b08d57]/[0.02]"
        : "border-white/[0.07] bg-white/[0.015]"
    }`}>
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 mb-3">
          <Pin size={11} className="text-[#b08d57]/60" strokeWidth={2} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b08d57]/60">Pinned</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
          post.author_role === "owner"
            ? "bg-[#b08d57]/15 text-[#b08d57] border border-[#b08d57]/20"
            : "bg-white/[0.06] text-white/50 border border-white/[0.08]"
        }`}>
          {getInitials(post.author_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white/80">{post.author_name}</span>
            {post.author_role && post.author_role !== "member" && (
              <RoleBadge role={post.author_role} />
            )}
          </div>
          <p className="text-[10px] text-white/30 mt-0.5">{formatDate(post.created_at)}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-white/65 leading-relaxed line-clamp-5">
        {post.content}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-white/[0.05]">
        <button className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/60 transition-colors">
          <Heart size={13} strokeWidth={1.8} />
          {post.likes_count}
        </button>
        <button className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/60 transition-colors">
          <MessageCircle size={13} strokeWidth={1.8} />
          {post.comments_count}
        </button>
        <button className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-white/60 transition-colors ml-auto">
          <Share2 size={13} strokeWidth={1.8} />
          Share
        </button>
      </div>
    </div>
  );
}

function DiscussionTab({ group, isMember, onJoinRequest }: { group: GroupData; isMember: boolean; onJoinRequest: () => void }) {
  const pinned  = group.posts.filter(p => p.is_pinned);
  const regular = group.posts.filter(p => !p.is_pinned);

  return (
    <div className="max-w-2xl space-y-6">

      {/* Composer / join prompt */}
      {isMember ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <span className="text-[10px] text-white/30">You</span>
          </div>
          <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 text-sm text-white/25 cursor-text">
            Write something for the group...
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5 flex flex-col items-center text-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <Lock size={16} className="text-white/25" strokeWidth={1.6} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/55 mb-1">Join to post and participate</p>
            <p className="text-[11px] text-white/30 max-w-xs leading-relaxed">
              {group.privacy === "private"
                ? "This is a private group. Join to see the full discussion and post your own."
                : "Join this group to participate in discussions."}
            </p>
          </div>
          <button
            onClick={onJoinRequest}
            className="px-5 py-2 rounded-full bg-[#b08d57] text-black text-xs font-bold hover:bg-[#9a7545] transition-colors"
          >
            {group.join_policy === "open" ? "Join Group" : "Request to Join"}
          </button>
        </div>
      )}

      {/* Pinned posts */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          {pinned.map(post => (
            <PostCard key={post.id} post={post} isMember={isMember} />
          ))}
        </div>
      )}

      {/* Regular posts */}
      {regular.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <SectionLabel label="Recent Discussion" variant="standard" className="mb-3" />
          )}
          {regular.map(post => (
            <PostCard key={post.id} post={post} isMember={isMember} />
          ))}
        </div>
      )}

    </div>
  );
}

// ── Members tab ───────────────────────────────────────────────────────────────

function MemberRow({ member }: { member: GroupMember }) {
  return (
    <Link
      href={`/people/${member.username}`}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
    >
      <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold ${
        member.role === "owner"
          ? "bg-[#b08d57]/15 text-[#b08d57] border border-[#b08d57]/20"
          : "bg-white/[0.06] text-white/50 border border-white/[0.08]"
      }`}>
        {getInitials(member.full_name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white/75 group-hover:text-[#b08d57] transition-colors truncate">
            {member.full_name}
          </p>
          <RoleBadge role={member.role} />
        </div>
        {member.headline && (
          <p className="text-[11px] text-white/35 truncate">{member.headline}</p>
        )}
      </div>
      <p className="text-[10px] text-white/25 shrink-0">
        Joined {formatDate(member.joined_at)}
      </p>
    </Link>
  );
}

function MembersTab({ group }: { group: GroupData }) {
  const leadership = group.members.filter(m => m.role === "owner" || m.role === "admin" || m.role === "moderator");
  const members    = group.members.filter(m => m.role === "member");

  return (
    <div className="space-y-8">

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" strokeWidth={1.8} />
        <input
          type="text"
          placeholder="Search members..."
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-white/20 text-white placeholder:text-white/25"
        />
      </div>

      {/* Leadership */}
      {leadership.length > 0 && (
        <section>
          <SectionLabel label={`Leadership · ${leadership.length}`} variant="featured" className="mb-3" />
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] overflow-hidden divide-y divide-white/[0.04]">
            {leadership.map(m => (
              <MemberRow key={m.id} member={m} />
            ))}
          </div>
        </section>
      )}

      {/* Members */}
      {members.length > 0 && (
        <section>
          <SectionLabel label={`Members · ${members.length}`} variant="standard" className="mb-3" />
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] overflow-hidden divide-y divide-white/[0.04]">
            {members.map(m => (
              <MemberRow key={m.id} member={m} />
            ))}
          </div>
        </section>
      )}

      {/* Count note */}
      <p className="text-[11px] text-white/25">
        Showing {group.members.length} of {group.member_count} members.
      </p>

    </div>
  );
}

// ── Events tab ────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: GroupEvent }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-white/[0.07] bg-white/[0.015] hover:border-white/15 transition-colors group"
    >
      {/* Date block */}
      <div className="shrink-0 w-14 h-14 rounded-xl border border-white/[0.08] bg-white/[0.03] flex flex-col items-center justify-center">
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#b08d57]/70">
          {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
        </span>
        <span className="text-xl font-bold text-white leading-none">
          {new Date(event.date).getDate()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white/80 group-hover:text-[#b08d57] transition-colors leading-snug mb-1.5">
          {event.name}
        </h3>
        {event.description && (
          <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 mb-2">
            {event.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/30">
          {event.time && (
            <span className="flex items-center gap-1">
              <Clock size={10} strokeWidth={1.8} />
              {event.time}
            </span>
          )}
          {(event.city || event.location) && (
            <span className="flex items-center gap-1">
              <MapPin size={10} strokeWidth={1.8} />
              {[event.location, event.city, event.country].filter(Boolean).join(", ")}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={10} strokeWidth={1.8} />
            {event.attendees_count} attending
          </span>
        </div>
      </div>
    </Link>
  );
}

function EventsTab({ group }: { group: GroupData }) {
  const upcoming = group.events.filter(e => !e.is_past);
  const past     = group.events.filter(e => e.is_past);

  return (
    <div className="max-w-2xl space-y-8">

      {upcoming.length > 0 && (
        <section>
          <SectionLabel label={`Upcoming · ${upcoming.length}`} variant="featured" className="mb-4" />
          <div className="space-y-3">
            {upcoming.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <SectionLabel label={`Past Events · ${past.length}`} variant="standard" className="mb-4" />
          <div className="space-y-3 opacity-60">
            {past.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      {group.events.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <CalendarDays className="w-8 h-8 text-white/15 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-white/35">No events scheduled yet.</p>
        </div>
      )}

    </div>
  );
}

// ── Media tab ─────────────────────────────────────────────────────────────────

function MediaTab({ group, isMember }: { group: GroupData; isMember: boolean }) {
  const photos = group.media.filter(m => m.type === "photo");
  const videos = group.media.filter(m => m.type === "video");

  const tileColors = [
    "bg-purple-500/10",
    "bg-sky-500/10",
    "bg-emerald-500/10",
    "bg-[#b08d57]/10",
    "bg-rose-500/10",
    "bg-indigo-500/10",
  ];

  return (
    <div className="space-y-8">

      {isMember && (
        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.10] text-sm font-medium text-white/50 hover:text-white/75 hover:border-white/20 transition-colors">
          <Upload size={14} strokeWidth={1.8} />
          Upload Media
        </button>
      )}

      {photos.length > 0 && (
        <section>
          <SectionLabel label={`Photos · ${photos.length}`} variant="featured" className="mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((item, idx) => (
              <div
                key={item.id}
                className={`aspect-square rounded-xl border border-white/[0.06] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/15 transition-colors ${tileColors[idx % tileColors.length]}`}
              >
                <Image size={20} className="text-white/20" strokeWidth={1.5} />
                {item.caption && (
                  <p className="text-[9px] text-white/30 text-center px-2 leading-tight line-clamp-2">{item.caption}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section>
          <SectionLabel label={`Videos · ${videos.length}`} variant="standard" className="mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {videos.map((item, idx) => (
              <div
                key={item.id}
                className={`aspect-video rounded-xl border border-white/[0.06] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-white/15 transition-colors ${tileColors[(idx + 3) % tileColors.length]}`}
              >
                <Video size={20} className="text-white/20" strokeWidth={1.5} />
                {item.caption && (
                  <p className="text-[9px] text-white/30 text-center px-2 leading-tight line-clamp-2">{item.caption}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {group.media.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <Image className="w-8 h-8 text-white/15 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-white/35">No media uploaded yet.</p>
        </div>
      )}

    </div>
  );
}

// ── Files tab ─────────────────────────────────────────────────────────────────

function FilesTab({ group, isMember }: { group: GroupData; isMember: boolean }) {
  return (
    <div className="max-w-2xl space-y-6">

      {isMember && (
        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.10] text-sm font-medium text-white/50 hover:text-white/75 hover:border-white/20 transition-colors">
          <Upload size={14} strokeWidth={1.8} />
          Upload File
        </button>
      )}

      {group.files.length > 0 ? (
        <div className="space-y-3">
          {group.files.map((file) => (
            <div
              key={file.id}
              className="flex items-start gap-4 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.015] hover:border-white/12 transition-colors"
            >
              <FileTypeIcon type={file.file_type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/75 mb-0.5">{file.name}</p>
                {file.description && (
                  <p className="text-[11px] text-white/40 leading-relaxed mb-2">{file.description}</p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-white/25">
                  <span className="uppercase font-bold text-white/35">{file.file_type}</span>
                  <span>·</span>
                  <span>{formatFileSize(file.file_size_kb)}</span>
                  <span>·</span>
                  <span>Uploaded by {file.uploaded_by}</span>
                  <span>·</span>
                  <span>{formatDate(file.uploaded_at)}</span>
                </div>
              </div>
              <a
                href={file.url}
                onClick={e => e.stopPropagation()}
                className="shrink-0 p-2 rounded-lg border border-white/[0.08] text-white/35 hover:text-white/65 hover:border-white/20 transition-colors"
              >
                <Download size={14} strokeWidth={1.8} />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="w-8 h-8 text-white/15 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-white/35">No files uploaded yet.</p>
        </div>
      )}

    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GroupProfilePage({ group }: { group: GroupData }) {
  const [activeTab,        setActiveTab]        = useState<TabId>("about");
  const [isMember,         setIsMember]         = useState(group.is_member);
  const [currentUserRole,  setCurrentUserRole]  = useState<GroupMemberRole | null>(group.current_user_role ?? null);

  // Hydrate membership state from Supabase on client mount
  useEffect(() => {
    async function checkMembership() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("group_members")
        .select("role, status")
        .eq("group_id", group.id)
        .eq("profile_id", user.id)
        .eq("status", "active")
        .single();

      if (data) {
        setIsMember(true);
        setCurrentUserRole(data.role as GroupMemberRole);
      }
    }
    checkMembership();
  }, [group.id]);

  function handleJoinRequest() {
    // TODO: wire to API
    setIsMember(true);
  }

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">

      {/* Hero */}
      <GroupHero group={{ ...group, is_member: isMember }} currentUserRole={currentUserRole} onJoinRequest={handleJoinRequest} />

      {/* Tab nav — sticky below navbar */}
      <GroupTabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {activeTab === "about"      && <AboutTab      group={group} />}
        {activeTab === "discussion" && <DiscussionTab group={group} isMember={isMember} onJoinRequest={handleJoinRequest} />}
        {activeTab === "members"    && <MembersTab    group={group} />}
        {activeTab === "events"     && <EventsTab     group={group} />}
        {activeTab === "media"      && <MediaTab      group={group} isMember={isMember} />}
        {activeTab === "files"      && <FilesTab      group={group} isMember={isMember} />}
      </div>

    </div>
  );
}
