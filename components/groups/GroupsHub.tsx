"use client";

import { useState, useEffect, useMemo } from "react";
import { getGroups, type GroupListItem } from "@/lib/services/groupService";
import {
  PATHS,
  FOCUS_AREAS_BY_PATH,
  getPath,
  getFocusAreas,
  getFocusAreaLabel,
  parseTaxonomyCategory,
  type PathId,
  type GroupTypeId,
} from "@/lib/constants/taxonomy";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Users, Network, Plus, BookMarked } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";

// ── Local types ────────────────────────────────────────────────────────────────

interface Group {
  id:          string;
  slug:        string;
  name:        string;
  path:        PathId;
  focusArea:   string;
  groupType?:  GroupTypeId;
  description: string;
  members:     number;
  activity:    string;
  isNew?:      boolean;
}

// ── Seed data ──────────────────────────────────────────────────────────────────
// Mapped to the new taxonomy: Path + Focus Area + Group Type

const GROUPS: Group[] = [
  {
    id:          "1",
    slug:        "albanian-parents-network",
    name:        "Albanian Parents Network",
    path:        "roots",
    focusArea:   "parenting",
    groupType:   "support",
    description: "Connecting Albanian parents across North America to share resources, school programs, and community events.",
    members:     214,
    activity:    "12 posts this week",
  },
  {
    id:          "2",
    slug:        "shkolla-shqipe-coordinators",
    name:        "Shkolla Shqipe Coordinators",
    path:        "roots",
    focusArea:   "schools",
    groupType:   "leadership",
    description: "For teachers and organizers of Albanian language schools. Share curriculum, coordinate schedules, and grow enrollment.",
    members:     87,
    activity:    "5 posts this week",
  },
  {
    id:          "3",
    slug:        "albanian-moms-nyc",
    name:        "Albanian Moms NYC",
    path:        "roots",
    focusArea:   "parenting",
    groupType:   "support",
    description: "A local group for Albanian mothers in the New York metro area. Playdates, school advice, and mutual support.",
    members:     63,
    activity:    "9 posts this week",
    isNew:       true,
  },
  {
    id:          "4",
    slug:        "early-career-albanians",
    name:        "Early Career Albanians",
    path:        "growth",
    focusArea:   "early-career",
    groupType:   "learning",
    description: "For professionals in their 20s and 30s. Jobs, mentors, skill-building, and peer support across all industries.",
    members:     341,
    activity:    "28 posts this week",
  },
  {
    id:          "5",
    slug:        "wac-mentorship-network",
    name:        "WAC Mentorship Network",
    path:        "leadership",
    focusArea:   "mentorship",
    groupType:   "mentorship",
    description: "Matching experienced professionals with students and early-career members. Applications open each semester.",
    members:     259,
    activity:    "Active",
  },
  {
    id:          "6",
    slug:        "albanian-women-in-leadership",
    name:        "Albanian Women in Leadership",
    path:        "leadership",
    focusArea:   "organizing",
    groupType:   "leadership",
    description: "A professional circle for Albanian women in executive, founder, and leadership roles across all sectors.",
    members:     118,
    activity:    "11 posts this week",
    isNew:       true,
  },
  {
    id:          "7",
    slug:        "albanian-tech-ai",
    name:        "Albanian Tech & AI",
    path:        "growth",
    focusArea:   "technology",
    groupType:   "network",
    description: "Engineers, founders, and builders in tech. Weekly threads, startup spotlights, hiring opportunities, and AI discussions.",
    members:     193,
    activity:    "41 posts this week",
  },
  {
    id:          "8",
    slug:        "albanian-founders-circle",
    name:        "Albanian Founders Circle",
    path:        "growth",
    focusArea:   "entrepreneurship",
    groupType:   "network",
    description: "For entrepreneurs building companies. Fundraising, co-founder search, investor introductions, and founder AMAs.",
    members:     97,
    activity:    "14 posts this week",
    isNew:       true,
  },
  {
    id:          "9",
    slug:        "albanian-real-estate-circle",
    name:        "Albanian Real Estate Circle",
    path:        "growth",
    focusArea:   "finance",
    groupType:   "network",
    description: "Agents, investors, and developers across residential and commercial real estate. Deals, resources, and market intel.",
    members:     128,
    activity:    "8 posts this week",
  },
  {
    id:          "10",
    slug:        "summer-eagles",
    name:        "Summer Eagles",
    path:        "living",
    focusArea:   "travel",
    groupType:   "interest",
    description: "For diaspora who spend extended time back in the Balkans. Logistics, property management, local meetups, and long-stay guides.",
    members:     176,
    activity:    "19 posts this week",
  },
  {
    id:          "11",
    slug:        "original-balkans-travelers",
    name:        "OriginAL — Balkans Travelers",
    path:        "living",
    focusArea:   "travel",
    groupType:   "interest",
    description: "Young diaspora adults exploring Albania, Kosovo, and North Macedonia for the first time. Trip coordination and cultural immersion.",
    members:     142,
    activity:    "22 posts this week",
  },
];

// ── DB → Group conversion ──────────────────────────────────────────────────────

function dbToGroup(item: GroupListItem): Group {
  const { path, focusArea, groupType } = parseTaxonomyCategory(item.category);
  return {
    id:          item.id,
    slug:        item.slug,
    name:        item.name,
    path,
    focusArea,
    groupType,
    description: item.description ?? "",
    members:     item.member_count,
    activity:    "Active",
    isNew:       true,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatMembers(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ── Group Card ─────────────────────────────────────────────────────────────────

function GroupCard({ group }: { group: Group }) {
  const path           = getPath(group.path);
  const focusAreaLabel = getFocusAreaLabel(group.focusArea);

  return (
    <Link
      href={`/groups/${group.slug}`}
      className="wac-card group relative flex flex-col p-4 hover:border-white/15 transition-colors"
    >
      {group.isNew && (
        <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/25">
          New
        </span>
      )}

      <div className="flex items-start gap-3 mb-2.5">
        {/* Initials avatar — colored by Path */}
        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-[11px] ${path.bg} ${path.color}`}>
          {getInitials(group.name)}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className={`font-semibold text-sm text-white/90 leading-snug group-hover:text-amber-400 transition-colors ${group.isNew ? "pr-10" : "pr-2"}`}>
            {group.name}
          </h3>
          {/* Path · Focus Area — primary taxonomy label */}
          <span className={`text-[10px] font-medium ${path.color} opacity-70`}>
            {path.label} · {focusAreaLabel}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2 mb-3">
        {group.description}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] text-white/30 min-w-0">
          <span className="flex items-center gap-1 shrink-0">
            <Users size={11} />
            {formatMembers(group.members)} members
          </span>
          <span className="text-white/15">·</span>
          <span className="truncate">{group.activity}</span>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="shrink-0 wac-btn-primary wac-btn-sm"
        >
          Join
        </button>
      </div>
    </Link>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type ViewMode = "all" | "mine";

export default function GroupsHub() {
  const [viewMode,         setViewMode]         = useState<ViewMode>("all");
  const [activePath,       setActivePath]       = useState<PathId | "all">("all");
  const [activeFocusArea,  setActiveFocusArea]  = useState<string | null>(null);
  const [dbGroups,         setDbGroups]         = useState<Group[]>([]);
  const [myGroupSlugs,     setMyGroupSlugs]     = useState<Set<string>>(new Set());
  const [isLoggedIn,       setIsLoggedIn]       = useState(false);

  useEffect(() => {
    getGroups().then((items) => setDbGroups(items.map(dbToGroup)));

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setIsLoggedIn(true);
      supabase
        .from("group_members")
        .select("group_id, groups!inner(slug)")
        .eq("profile_id", user.id)
        .eq("status", "active")
        .then(({ data }) => {
          if (data) {
            const slugs = new Set(
              data.map((row: any) => row.groups?.slug).filter(Boolean)
            );
            setMyGroupSlugs(slugs);
          }
        });
    });
  }, []);

  // Merge DB groups with seed data (dedup by slug)
  const allGroups = useMemo(() => [
    ...dbGroups,
    ...GROUPS.filter((g) => !dbGroups.some((d) => d.slug === g.slug)),
  ], [dbGroups]);

  // Count groups per path for the path card badges
  const groupCountByPath = useMemo(() => {
    const counts: Partial<Record<PathId, number>> = {};
    allGroups.forEach((g) => {
      counts[g.path] = (counts[g.path] ?? 0) + 1;
    });
    return counts;
  }, [allGroups]);

  // Filtered list
  const filteredGroups = useMemo(() => allGroups.filter((g) => {
    if (viewMode === "mine")   return myGroupSlugs.has(g.slug);
    if (activePath !== "all") {
      if (g.path !== activePath) return false;
      if (activeFocusArea)       return g.focusArea === activeFocusArea;
    }
    return true;
  }), [allGroups, viewMode, activePath, activeFocusArea, myGroupSlugs]);

  // Derived state
  const pathDef      = activePath !== "all" ? getPath(activePath) : null;
  const focusAreas   = activePath !== "all" ? getFocusAreas(activePath) : [];
  const activeFADef  = focusAreas.find((fa) => fa.id === activeFocusArea);

  const groupsLabel =
    viewMode === "mine"
      ? "My Groups"
      : pathDef
      ? activeFADef
        ? `${pathDef.label} · ${activeFADef.label}`
        : pathDef.label
      : "All Groups";

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handlePathClick(id: PathId) {
    if (activePath === id) {
      // Deselect: back to "all"
      setActivePath("all");
      setActiveFocusArea(null);
    } else {
      setActivePath(id);
      setActiveFocusArea(null);
      setViewMode("all");
    }
  }

  function handleFocusAreaClick(id: string) {
    setActiveFocusArea((prev) => (prev === id ? null : id));
  }

  function handleViewMode(mode: ViewMode) {
    setViewMode(mode);
    setActivePath("all");
    setActiveFocusArea(null);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-24">

        {/* Heading */}
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-white leading-tight">
          <span className="italic font-light opacity-90 text-amber-400">Groups</span>
        </h1>

        <p className="mt-2 text-sm text-white/50">
          Communities organized around shared paths — roots, growth, living, and leadership.
        </p>

        {/* View mode tabs */}
        <div className="mt-6 flex items-center gap-1.5">
          <button
            onClick={() => handleViewMode("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-[0.02em] border transition-colors ${
              viewMode === "all"
                ? "border-amber-400/30 bg-amber-500/[0.08] text-amber-400"
                : "border-white/[0.10] text-white/45 hover:text-white/70 hover:border-white/18"
            }`}
          >
            All Groups
          </button>

          {isLoggedIn && (
            <button
              onClick={() => handleViewMode("mine")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-[0.02em] border transition-colors ${
                viewMode === "mine"
                  ? "border-amber-400/30 bg-amber-500/[0.08] text-amber-400"
                  : "border-white/[0.10] text-white/45 hover:text-white/70 hover:border-white/18"
              }`}
            >
              <BookMarked size={13} strokeWidth={1.8} />
              My Groups
              {myGroupSlugs.size > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  viewMode === "mine"
                    ? "bg-amber-400/20 text-amber-400"
                    : "bg-white/[0.08] text-white/40"
                }`}>
                  {myGroupSlugs.size}
                </span>
              )}
            </button>
          )}
        </div>

        {/* ── Browse by Path ──────────────────────────────────────────────── */}
        {viewMode === "all" && (
          <section className="mt-8">
            <SectionLabel
              label="Browse by Path"
              variant="featured"
              action={
                activePath !== "all"
                  ? { label: "Clear", onClick: () => { setActivePath("all"); setActiveFocusArea(null); } }
                  : undefined
              }
              className="mb-4"
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {PATHS.map((path) => {
                const isActive = activePath === path.id;
                const count    = groupCountByPath[path.id] ?? 0;
                return (
                  <button
                    key={path.id}
                    onClick={() => handlePathClick(path.id)}
                    className={`text-left px-3.5 py-3 rounded-xl border transition-all ${
                      isActive
                        ? `${path.border} ${path.bg}`
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.13] hover:bg-white/[0.03]"
                    }`}
                  >
                    {/* Dot · label · count */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${path.dot} ${isActive ? "" : "opacity-70"}`} />
                      <span className={`text-[13px] font-semibold flex-1 leading-none ${isActive ? path.color : "text-white/80"}`}>
                        {path.label}
                      </span>
                      <span className={`text-[10px] font-medium tabular-nums ${isActive ? `${path.color} opacity-60` : "text-white/22"}`}>
                        {count}
                      </span>
                    </div>
                    {/* One-line short descriptor */}
                    <p className="text-[10px] text-white/32 leading-tight line-clamp-1 pl-[14px]">
                      {path.short}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Focus Area chips (appears when a Path is selected) ──────────── */}
        {viewMode === "all" && activePath !== "all" && focusAreas.length > 0 && (
          <section className="mt-4">
            <div className="relative">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {/* "All [Path]" reset chip */}
                <button
                  onClick={() => setActiveFocusArea(null)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-colors whitespace-nowrap ${
                    !activeFocusArea
                      ? `${pathDef!.border} ${pathDef!.bg} ${pathDef!.color}`
                      : "border-white/[0.12] text-white/50 hover:text-white/75 hover:border-white/18"
                  }`}
                >
                  All {pathDef!.label}
                </button>

                {focusAreas.map((fa) => {
                  const isActive = activeFocusArea === fa.id;
                  return (
                    <button
                      key={fa.id}
                      onClick={() => handleFocusAreaClick(fa.id)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? `${pathDef!.border} ${pathDef!.bg} ${pathDef!.color}`
                          : "border-white/[0.12] text-white/50 hover:text-white/75 hover:border-white/18"
                      }`}
                    >
                      {fa.label}
                    </button>
                  );
                })}
              </div>
              {/* Overflow fade */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[var(--background)] to-transparent" />
            </div>
          </section>
        )}

        {/* ── Groups list ─────────────────────────────────────────────────── */}
        <section className="mt-8">
          <SectionLabel
            label={`${groupsLabel} · ${filteredGroups.length} ${filteredGroups.length === 1 ? "group" : "groups"}`}
            variant="standard"
            className="mb-4"
          />

          {filteredGroups.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          ) : viewMode === "mine" ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookMarked className="w-8 h-8 text-white/20 mb-4" strokeWidth={1.5} />
              <h3 className="text-base font-semibold text-white/50 mb-1.5">No groups joined yet</h3>
              <p className="text-sm text-white/30 leading-relaxed max-w-xs">
                Switch to All Groups to browse and join communities.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Network className="w-8 h-8 text-white/20 mb-4" strokeWidth={1.5} />
              <h3 className="text-base font-semibold text-white/50 mb-1.5">No groups found</h3>
              <p className="text-sm text-white/30 leading-relaxed">
                {activeFocusArea
                  ? `No groups in this focus area yet. Try browsing all ${pathDef?.label} groups.`
                  : "No groups in this Path yet. Be the first to create one."}
              </p>
            </div>
          )}
        </section>

        {/* ── Create CTA ──────────────────────────────────────────────────── */}
        {viewMode === "all" && (
          <section className="mt-10 p-5 md:p-6 rounded-2xl bg-white/[0.025] border border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-sm text-white mb-0.5">
                Don&apos;t see your community?
              </h3>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Groups can form around any shared path, focus area, or life moment.
              </p>
            </div>
            <Link
              href="/groups/new"
              className="shrink-0 flex items-center gap-2 px-5 py-2 rounded-full border border-amber-400/25 text-amber-400/60 text-xs font-medium tracking-[0.04em] hover:border-amber-400/45 hover:text-amber-400 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create a Group
            </Link>
          </section>
        )}

      </div>
    </div>
  );
}
