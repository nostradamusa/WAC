"use client";

import { useState } from "react";
import {
  Baby,
  TrendingUp,
  Briefcase,
  Plane,
  Users,
  Plus,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type PathwayId = "family" | "career" | "industry" | "travel";

interface Pathway {
  id: PathwayId;
  title: string;
  tagline: string;
  icon: React.ElementType;
  color: string;
  mutedColor: string;
  iconBg: string;
  cardBg: string;
  border: string;
  activeBorder: string;
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

// ── Static seed data ───────────────────────────────────────────────────────
// These will be replaced with DB queries once the groups table is live.

const PATHWAYS: Pathway[] = [
  {
    id: "family",
    title: "Family & Roots",
    tagline: "Raise children with their Albanian identity",
    icon: Baby,
    color: "text-purple-400",
    mutedColor: "text-purple-400/70",
    iconBg: "bg-purple-500/15",
    cardBg: "bg-purple-500/[0.05]",
    border: "border-purple-500/15",
    activeBorder: "border-purple-400/50",
    groupCount: 3,
  },
  {
    id: "career",
    title: "Career & Momentum",
    tagline: "Grow professionally within the network",
    icon: TrendingUp,
    color: "text-sky-400",
    mutedColor: "text-sky-400/70",
    iconBg: "bg-sky-500/15",
    cardBg: "bg-sky-500/[0.05]",
    border: "border-sky-500/15",
    activeBorder: "border-sky-400/50",
    groupCount: 3,
  },
  {
    id: "industry",
    title: "Industry & Influence",
    tagline: "Connect with peers in your professional field",
    icon: Briefcase,
    color: "text-[#D4AF37]",
    mutedColor: "text-[#D4AF37]/70",
    iconBg: "bg-[#D4AF37]/15",
    cardBg: "bg-[#D4AF37]/[0.05]",
    border: "border-[#D4AF37]/15",
    activeBorder: "border-[#D4AF37]/50",
    groupCount: 3,
  },
  {
    id: "travel",
    title: "Travel & Lifestyle",
    tagline: "Stay connected across borders",
    icon: Plane,
    color: "text-emerald-400",
    mutedColor: "text-emerald-400/70",
    iconBg: "bg-emerald-500/15",
    cardBg: "bg-emerald-500/[0.05]",
    border: "border-emerald-500/15",
    activeBorder: "border-emerald-400/50",
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

// ── Helpers ────────────────────────────────────────────────────────────────

function formatMembers(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ── Group card ─────────────────────────────────────────────────────────────

function GroupCard({ group, pathway }: { group: Group; pathway: Pathway }) {
  return (
    <div className="wac-card p-4 flex items-start gap-3.5 group hover:border-white/15 transition-colors">
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${pathway.iconBg} ${pathway.color}`}
      >
        {getInitials(group.name)}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-sm text-white truncate leading-snug">
              {group.name}
            </h3>
            {group.isNew && (
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
                New
              </span>
            )}
          </div>
          <button
            className={`shrink-0 text-[11px] font-bold px-3 py-1 rounded-full border transition-colors ${pathway.border} ${pathway.color} hover:${pathway.cardBg}`}
          >
            Join
          </button>
        </div>

        <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 mb-1.5">
          {group.description}
        </p>

        <div className="flex items-center gap-2.5 text-[10px] text-white/30">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {formatMembers(group.members)} members
          </span>
          <span className="text-white/15">·</span>
          <span className={group.isNew ? "text-[var(--accent)]/60" : ""}>
            {group.activity}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function GroupsHub() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeCategory, setActiveCategory] = useState("All");

  const handlePathwayClick = (pathwayId: string) => {
    setActiveFilter(prev => prev === pathwayId ? "all" : pathwayId);
    setActiveCategory("All");
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    setActiveFilter("all");
  };

  const filteredGroups = GROUPS.filter(g => {
    if (activeCategory !== "All") return g.category === activeCategory;
    if (activeFilter !== "all") return g.pathway === activeFilter;
    return true;
  });

  const activePathwayData = PATHWAYS.find(p => p.id === activeFilter);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-10 pb-24">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
          Find your{" "}
          <span className="text-[var(--accent)] italic font-light">people</span>
        </h1>
        <p className="text-sm text-white/45 max-w-xl leading-relaxed">
          Groups are communities organized around shared interests, life stage, career, or culture.
          Browse by pathway or category to find where you belong.
        </p>
      </div>

      {/* ── Featured Pathways ───────────────────────────────────────────── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/35">
            Featured Pathways
          </h2>
          {activeFilter !== "all" && (
            <button
              onClick={() => setActiveFilter("all")}
              className="text-[11px] text-white/35 hover:text-white/60 transition"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {PATHWAYS.map(pathway => {
            const Icon = pathway.icon;
            const isActive = activeFilter === pathway.id;
            return (
              <button
                key={pathway.id}
                onClick={() => handlePathwayClick(pathway.id)}
                className={`flex flex-col items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                  isActive
                    ? `${pathway.cardBg} ${pathway.activeBorder}`
                    : `bg-white/[0.025] ${pathway.border} hover:bg-white/[0.04]`
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pathway.iconBg}`}>
                  <Icon className={`w-4 h-4 ${pathway.color}`} strokeWidth={1.8} />
                </div>
                <div>
                  <p className={`text-sm font-semibold leading-snug mb-0.5 ${isActive ? pathway.color : "text-white/80"}`}>
                    {pathway.title}
                  </p>
                  <p className="text-[10px] text-white/35 leading-relaxed hidden sm:block">
                    {pathway.tagline}
                  </p>
                </div>
                <p className={`text-[10px] font-semibold ${pathway.mutedColor}`}>
                  {pathway.groupCount} groups
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Browse by Category ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-white/35">
          Browse by Category
        </h2>
        <div
          className="flex gap-2 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold border transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] border-[var(--accent)]/30"
                  : "bg-white/[0.03] text-white/40 border-white/[0.07] hover:text-white/65 hover:border-white/15"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Groups List ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/35">
            {activeFilter !== "all"
              ? activePathwayData?.title
              : activeCategory !== "All"
              ? activeCategory
              : "All Groups"}
            {" "}
            <span className="text-white/20 font-normal normal-case tracking-normal">
              — {filteredGroups.length} {filteredGroups.length === 1 ? "group" : "groups"}
            </span>
          </h2>
          <button className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] hover:text-[#F2D06B] font-semibold transition">
            <Plus className="w-3.5 h-3.5" />
            Suggest a group
          </button>
        </div>

        {filteredGroups.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-2.5">
            {filteredGroups.map(group => {
              const pathway = PATHWAYS.find(p => p.id === group.pathway)!;
              return <GroupCard key={group.id} group={group} pathway={pathway} />;
            })}
          </div>
        ) : (
          <div className="py-16 text-center space-y-2">
            <p className="text-white/40 text-sm">No groups in this category yet.</p>
            <p className="text-white/25 text-xs">Be the first to suggest one.</p>
          </div>
        )}
      </section>

      {/* ── Start a Group CTA ───────────────────────────────────────────── */}
      <section className="mt-4 p-5 md:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-sm text-white mb-0.5">Don't see your community?</h3>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Groups can form around any shared interest, city, profession, or life stage.
          </p>
        </div>
        <button className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent)] text-black text-xs font-bold hover:bg-[#F2D06B] transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Propose a Group
        </button>
      </section>
    </div>
  );
}
