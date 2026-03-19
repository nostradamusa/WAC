"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Baby,
  TrendingUp,
  Briefcase,
  Plane,
  Users,
  Plus,
} from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";

// ── Types ──────────────────────────────────────────────────────────────────────

type PathwayId = "family" | "career" | "industry" | "travel";

interface Pathway {
  id: PathwayId;
  title: string;
  tagline: string;
  icon: React.ElementType;
  // Icon accent — pathway-specific, used for avatar bg and icon color only
  iconBg: string;
  iconColor: string;
  groupCount: number;
}

interface Group {
  id: string;
  name: string;
  pathway: PathwayId;
  category: string;
  description: string;
  members: number;
  activity: string;
  isNew?: boolean;
}

// ── Static seed data ───────────────────────────────────────────────────────────
// Replace with DB queries once the groups table is live.

const PATHWAYS: Pathway[] = [
  {
    id: "family",
    title: "Family & Roots",
    tagline: "Raise children with their Albanian identity",
    icon: Baby,
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-400",
    groupCount: 3,
  },
  {
    id: "career",
    title: "Career & Momentum",
    tagline: "Grow professionally within the network",
    icon: TrendingUp,
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-400",
    groupCount: 3,
  },
  {
    id: "industry",
    title: "Industry & Influence",
    tagline: "Connect with peers in your professional field",
    icon: Briefcase,
    iconBg: "bg-[#D4AF37]/15",
    iconColor: "text-[#D4AF37]",
    groupCount: 3,
  },
  {
    id: "travel",
    title: "Travel & Lifestyle",
    tagline: "Stay connected across borders",
    icon: Plane,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    groupCount: 2,
  },
];

const CATEGORIES = [
  "All",
  "Parenting & Family",
  "Career & Professional",
  "Business & Founder",
  "Industry Circles",
  "Education & Mentorship",
  "Travel & Lifestyle",
  "Culture & Identity",
  "City / Region",
  "Special Interest",
];

const GROUPS: Group[] = [
  {
    id: "1",
    name: "Albanian Parents Network",
    pathway: "family",
    category: "Parenting & Family",
    description: "Connecting Albanian parents across North America to share resources, school programs, and community events.",
    members: 214,
    activity: "12 posts this week",
  },
  {
    id: "2",
    name: "Shkolla Shqipe Coordinators",
    pathway: "family",
    category: "Education & Mentorship",
    description: "For teachers and organizers of Albanian language schools. Share curriculum, coordinate schedules, and grow enrollment.",
    members: 87,
    activity: "5 posts this week",
  },
  {
    id: "3",
    name: "Albanian Moms NYC",
    pathway: "family",
    category: "Parenting & Family",
    description: "A local group for Albanian mothers in the New York metro area. Playdates, school advice, and mutual support.",
    members: 63,
    activity: "9 posts this week",
    isNew: true,
  },
  {
    id: "4",
    name: "Early Career Albanians",
    pathway: "career",
    category: "Career & Professional",
    description: "For professionals in their 20s and 30s. Jobs, mentors, skill-building, and peer support across all industries.",
    members: 341,
    activity: "28 posts this week",
  },
  {
    id: "5",
    name: "WAC Mentorship Network",
    pathway: "career",
    category: "Education & Mentorship",
    description: "Matching experienced professionals with students and early-career members. Applications open each semester.",
    members: 259,
    activity: "Active",
  },
  {
    id: "6",
    name: "Albanian Women in Leadership",
    pathway: "career",
    category: "Career & Professional",
    description: "A professional circle for Albanian women in executive, founder, and leadership roles across all sectors.",
    members: 118,
    activity: "11 posts this week",
    isNew: true,
  },
  {
    id: "7",
    name: "Albanian Tech & AI",
    pathway: "industry",
    category: "Industry Circles",
    description: "Engineers, founders, and builders in tech. Weekly threads, startup spotlights, hiring opportunities, and AI discussions.",
    members: 193,
    activity: "41 posts this week",
  },
  {
    id: "8",
    name: "Albanian Founders Circle",
    pathway: "industry",
    category: "Business & Founder",
    description: "For entrepreneurs building companies. Fundraising, co-founder search, investor introductions, and founder AMAs.",
    members: 97,
    activity: "14 posts this week",
    isNew: true,
  },
  {
    id: "9",
    name: "Albanian Real Estate Circle",
    pathway: "industry",
    category: "Business & Founder",
    description: "Agents, investors, and developers across residential and commercial real estate. Deals, resources, and market intel.",
    members: 128,
    activity: "8 posts this week",
  },
  {
    id: "10",
    name: "Summer Eagles",
    pathway: "travel",
    category: "Travel & Lifestyle",
    description: "For diaspora who spend extended time back in the Balkans. Logistics, property management, local meetups, and long-stay guides.",
    members: 176,
    activity: "19 posts this week",
  },
  {
    id: "11",
    name: "OriginAL — Balkans Travelers",
    pathway: "travel",
    category: "Travel & Lifestyle",
    description: "Young diaspora adults exploring Albania, Kosovo, and North Macedonia for the first time. Trip coordination and cultural immersion.",
    members: 142,
    activity: "22 posts this week",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatMembers(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ── Group card ─────────────────────────────────────────────────────────────────

function GroupCard({ group, pathway }: { group: Group; pathway: Pathway }) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="wac-card group relative flex flex-col p-4 hover:border-white/15 transition-colors"
    >
      {/* NEW badge — card-level corner overlay, not inline with the title */}
      {group.isNew && (
        <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/25">
          New
        </span>
      )}

      {/* Top: avatar + name + category */}
      <div className="flex items-start gap-3 mb-2.5">
        <div
          className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${pathway.iconBg} ${pathway.iconColor}`}
        >
          {getInitials(group.name)}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {/* Right-pad when NEW badge is present to avoid overlap */}
          <h3 className={`font-semibold text-sm text-white leading-snug group-hover:text-[#D4AF37] transition-colors ${group.isNew ? "pr-10" : "pr-2"}`}>
            {group.name}
          </h3>
          <span className="text-[10px] text-white/35">{group.category}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2 mb-3">
        {group.description}
      </p>

      {/* Footer: metadata + Join CTA */}
      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] text-white/30 min-w-0">
          <span className="flex items-center gap-1 shrink-0">
            <Users size={11} />
            {formatMembers(group.members)} members
          </span>
          <span className="text-white/15">·</span>
          <span className="truncate">{group.activity}</span>
        </div>
        {/* Tier 1 CTA: gold filled. stopPropagation prevents Link navigation. */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="shrink-0 text-[11px] font-bold px-3.5 py-1.5 rounded-full bg-[#D4AF37] text-black hover:bg-[#c9a430] transition-colors"
        >
          Join
        </button>
      </div>
    </Link>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function GroupsHub() {
  const [activePathway, setActivePathway] = useState<PathwayId | "all">("all");
  const [activeCategory, setActiveCategory] = useState("All");

  const handlePathwayClick = (pathwayId: PathwayId) => {
    setActivePathway(prev => prev === pathwayId ? "all" : pathwayId);
    setActiveCategory("All");
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    setActivePathway("all");
  };

  const filteredGroups = GROUPS.filter(g => {
    if (activeCategory !== "All") return g.category === activeCategory;
    if (activePathway !== "all") return g.pathway === activePathway;
    return true;
  });

  const activePathwayData = PATHWAYS.find(p => p.id === activePathway);

  // Section label for the groups list
  const groupsLabel = activePathway !== "all"
    ? activePathwayData?.title ?? "Groups"
    : activeCategory !== "All"
    ? activeCategory
    : "All Groups";

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-24">

        {/* ── Zone 1: Eyebrow ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-1.5">
          <Users size={13} className="text-white/30" strokeWidth={2} />
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">
            Groups
          </span>
        </div>

        {/* ── Zone 2: H1 — matches Directory / Events brand pattern ────────── */}
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-white leading-[1.1]">
          The{" "}
          <span className="italic text-[#D4AF37]">Groups</span>
        </h1>

        {/* ── Zone 3: Description ──────────────────────────────────────────── */}
        <p className="mt-2 text-sm text-white/50">
          Communities organized around career, family, culture &amp; lifestyle
        </p>

        {/* ── Featured Pathways ────────────────────────────────────────────── */}
        {/*
          Pathway cards are the top-level organizing lens for Groups.
          Each pathway has its own icon color for scanability, but the card
          base and active state use the unified wac-card system.
          Active state: brand gold border + subtle gold tint (Groups section-identity).
          Per-pathway colors apply to icons and avatars only — not card backgrounds.
        */}
        <section className="mt-8">
          <SectionLabel
            label="Featured Pathways"
            variant="featured"
            action={
              activePathway !== "all"
                ? { label: "Clear filter", href: "#" }
                : undefined
            }
            className="mb-4"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PATHWAYS.map(pathway => {
              const Icon = pathway.icon;
              const isActive = activePathway === pathway.id;
              return (
                <button
                  key={pathway.id}
                  onClick={() => handlePathwayClick(pathway.id)}
                  className={`wac-card text-left flex flex-col gap-3 p-4 transition-all ${
                    isActive
                      ? "border-[#D4AF37]/30 bg-[#D4AF37]/[0.04]"
                      : "hover:border-white/12"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pathway.iconBg}`}>
                    <Icon className={`w-4 h-4 ${pathway.iconColor}`} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold leading-snug mb-1 ${isActive ? "text-[#D4AF37]" : "text-white/80"}`}>
                      {pathway.title}
                    </p>
                    <p className="text-[10px] text-white/35 leading-relaxed">
                      {pathway.tagline}
                    </p>
                  </div>
                  <p className={`text-[10px] font-semibold ${isActive ? "text-[#D4AF37]/70" : "text-white/30"}`}>
                    {pathway.groupCount} {pathway.groupCount === 1 ? "group" : "groups"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Browse by Category ───────────────────────────────────────────── */}
        {/*
          Outlined pills — same spec as Events and Directory category chips.
          Horizontally scrollable with right-fade overflow indicator.
          Selecting a category clears the active pathway.
        */}
        <section className="mt-8">
          <SectionLabel label="Browse by Category" variant="standard" className="mb-4" />
          <div className="relative">
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
                    activeCategory === cat
                      ? "border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] text-[#D4AF37]/80"
                      : "border-white/[0.12] bg-transparent text-white/55 hover:text-white/80 hover:border-white/18"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--background)] to-transparent" />
          </div>
        </section>

        {/* ── Groups list ──────────────────────────────────────────────────── */}
        <section className="mt-8">
          <SectionLabel
            label={`${groupsLabel} · ${filteredGroups.length} ${filteredGroups.length === 1 ? "group" : "groups"}`}
            variant="standard"
            action={{ label: "Suggest a group", href: "#" }}
            className="mb-4"
          />

          {filteredGroups.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredGroups.map(group => {
                const pathway = PATHWAYS.find(p => p.id === group.pathway)!;
                return <GroupCard key={group.id} group={group} pathway={pathway} />;
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-8 h-8 text-white/20 mb-4" strokeWidth={1.5} />
              <h3 className="text-base font-semibold text-white/50 mb-1.5">No groups found</h3>
              <p className="text-sm text-white/30 max-w-sm leading-relaxed">
                No groups in this category yet. Be the first to suggest one.
              </p>
            </div>
          )}
        </section>

        {/* ── Start a Group CTA ────────────────────────────────────────────── */}
        <section className="mt-10 p-5 md:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-sm text-white mb-0.5">
              Don&apos;t see your community?
            </h3>
            <p className="text-[11px] text-white/40 leading-relaxed">
              Groups can form around any shared interest, city, profession, or life stage.
            </p>
          </div>
          {/* Tier 1 CTA: gold filled */}
          <button className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37] text-black text-xs font-bold hover:bg-[#c9a430] transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Propose a Group
          </button>
        </section>

      </div>
    </div>
  );
}
