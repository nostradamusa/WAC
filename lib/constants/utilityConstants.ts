// ─── Community Utility — shared constants ──────────────────────────────────────
// Tier definitions and display helpers for the Community Utility system.
// No scoring logic here — just constants and display labels.

export interface UtilityTier {
  slug: string;
  label: string;
  /** Short description of what this tier means */
  description: string;
  /** CSS classes for badge rendering */
  badgeCls: string;
  /** Minimum utility score to reach this tier (for future scoring logic) */
  minScore: number;
}

export const UTILITY_TIERS: UtilityTier[] = [
  {
    slug: "rising",
    label: "Rising",
    description: "New to the network",
    badgeCls: "text-white/50 bg-white/[0.05] border-white/10",
    minScore: 0,
  },
  {
    slug: "reliable",
    label: "Reliable",
    description: "Consistent contributor",
    badgeCls: "text-sky-400/80 bg-sky-500/10 border-sky-500/20",
    minScore: 25,
  },
  {
    slug: "trusted",
    label: "Trusted",
    description: "Active and helpful community member",
    badgeCls: "text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20",
    minScore: 100,
  },
  {
    slug: "cornerstone",
    label: "Cornerstone",
    description: "Pillar of the community",
    badgeCls: "text-[#b08d57]/80 bg-[#b08d57]/10 border-[#b08d57]/20",
    minScore: 250,
  },
  {
    slug: "pillar",
    label: "Pillar",
    description: "Exceptional contributor and leader",
    badgeCls: "text-[#b08d57] bg-[#b08d57]/15 border-[#b08d57]/30",
    minScore: 500,
  },
];

const tierMap = new Map(UTILITY_TIERS.map((t) => [t.slug, t]));

/** Get tier definition by slug */
export function getTierDef(slug: string | null | undefined): UtilityTier {
  if (!slug) return UTILITY_TIERS[0];
  return tierMap.get(slug) ?? UTILITY_TIERS[0];
}

/** Utility event types that can be logged */
export const UTILITY_EVENT_TYPES = [
  "ask_answered",
  "helpful_response",
  "mentorship_given",
  "referral_made",
  "event_hosted",
  "volunteer_posted",
  "fundraiser_posted",
  "group_contribution",
  "community_post",
] as const;

export type UtilityEventType = (typeof UTILITY_EVENT_TYPES)[number];
