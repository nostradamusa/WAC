// ─── Pulse Post Intents — shared constants ────────────────────────────────────
// Single source of truth for all post intents and their display treatment.
// Import from here; do not duplicate across files.

import {
  FileText,
  HelpCircle,
  Megaphone,
  Briefcase,
  Handshake,
  GraduationCap,
  Heart,
  MessageSquare,
  Users,
  DollarSign,
  Lightbulb,
  Home,
} from "lucide-react";

// ─── Intent definition ───────────────────────────────────────────────────────

export interface IntentDefinition {
  /** Machine slug — stored in DB as post_intent */
  slug: string;
  /** Human-readable label for UI */
  label: string;
  /** Lucide icon component */
  icon: typeof FileText;
  /** CSS classes for badge rendering (text + bg + border) */
  badgeCls: string;
  /** Whether this intent appears in the composer picker */
  composerVisible: boolean;
  /** Whether this intent has a custom card renderer (vs badge on PostCard) */
  hasCustomCard: boolean;
}

// ─── All intents ──────────────────────────────────────────────────────────────

export const POST_INTENTS: IntentDefinition[] = [
  {
    slug: "update",
    label: "Update",
    icon: FileText,
    badgeCls: "",
    composerVisible: true,
    hasCustomCard: false,
  },
  {
    slug: "ask",
    label: "Ask",
    icon: HelpCircle,
    badgeCls: "text-[#b08d57]/80 bg-[#b08d57]/10 border-[#b08d57]/20",
    composerVisible: true,
    hasCustomCard: true,
  },
  {
    slug: "announcement",
    label: "Announcement",
    icon: Megaphone,
    badgeCls: "text-[#b08d57]/80 bg-[#b08d57]/10 border-[#b08d57]/20",
    composerVisible: true,
    hasCustomCard: false,
  },
  {
    slug: "hiring",
    label: "Hiring",
    icon: Briefcase,
    badgeCls: "text-violet-400/80 bg-violet-500/10 border-violet-500/20",
    composerVisible: true,
    hasCustomCard: false,
  },
  {
    slug: "opportunity",
    label: "Opportunity",
    icon: Lightbulb,
    badgeCls: "text-sky-400/80 bg-sky-500/10 border-sky-500/20",
    composerVisible: true,
    hasCustomCard: false,
  },
  {
    slug: "mentorship",
    label: "Mentorship",
    icon: GraduationCap,
    badgeCls: "text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20",
    composerVisible: true,
    hasCustomCard: false,
  },
  {
    slug: "referral",
    label: "Referral",
    icon: Handshake,
    badgeCls: "text-amber-400/80 bg-amber-500/10 border-amber-500/20",
    composerVisible: true,
    hasCustomCard: false,
  },
  {
    slug: "discussion",
    label: "Discussion",
    icon: MessageSquare,
    badgeCls: "text-white/50 bg-white/[0.05] border-white/10",
    composerVisible: true,
    hasCustomCard: false,
  },
  {
    slug: "volunteer",
    label: "Volunteer",
    icon: Heart,
    badgeCls: "text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20",
    composerVisible: true,
    hasCustomCard: false,
  },
  {
    slug: "fundraiser",
    label: "Fundraiser",
    icon: DollarSign,
    badgeCls: "text-rose-400/80 bg-rose-500/10 border-rose-500/20",
    composerVisible: true,
    hasCustomCard: false,
  },
  {
    slug: "event",
    label: "Event",
    icon: Users,
    badgeCls: "text-[#b08d57]/80 bg-[#b08d57]/10 border-[#b08d57]/20",
    composerVisible: false, // Event routes to /events/create, not inline
    hasCustomCard: false,
  },
  {
    slug: "property_listing",
    label: "Property",
    icon: Home,
    badgeCls: "text-[#10b981]/80 bg-[#10b981]/10 border-[#10b981]/20",
    composerVisible: false, // Created via /properties/new, not inline composer
    hasCustomCard: true,
  },
];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

const intentMap = new Map(POST_INTENTS.map((i) => [i.slug, i]));

/** Get intent definition by slug */
export function getIntentDef(slug: string | null | undefined): IntentDefinition | null {
  if (!slug) return null;
  return intentMap.get(slug) ?? null;
}

/** Get badge classes for rendering intent tags on PostCard */
export function getIntentBadgeCls(slug: string | null | undefined): string {
  return getIntentDef(slug)?.badgeCls ?? "";
}

/** Get human label for an intent slug */
export function getIntentLabel(slug: string | null | undefined): string {
  return getIntentDef(slug)?.label ?? "";
}

/** Intents visible in the composer picker */
export const COMPOSER_INTENTS = POST_INTENTS.filter((i) => i.composerVisible);

/** Intents that show a badge on PostCard (excludes "update" which has no badge) */
export const BADGE_INTENTS = POST_INTENTS.filter((i) => i.badgeCls && i.slug !== "update");
