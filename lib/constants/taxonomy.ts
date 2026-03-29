/**
 * WAC Unified Taxonomy System
 *
 * Layer 1: Path        — top-level entry point (4 paths)
 * Layer 2: Focus Area  — specific topic or need within a path
 * Layer 3: Content Type — Group | Event | Guide | Resource | Mentor | Crash Course | Opportunity
 * Layer 4: Group Type / Event Type — how the thing functions
 *
 * Used by: Groups, Events, Resources, Mentorship, and all future WAC surfaces.
 */

// ── Path ───────────────────────────────────────────────────────────────────────

export type PathId =
  | "roots"
  | "growth"
  | "living"
  | "leadership";

export interface Path {
  id:          PathId;
  label:       string;
  description: string;
  /** Compact one-line card descriptor for browse UI */
  short:       string;
  /** Tailwind text color class */
  color:       string;
  /** Tailwind subtle bg class */
  bg:          string;
  /** Tailwind border color class */
  border:      string;
  /** Tailwind solid dot bg class */
  dot:         string;
}

export const PATHS: Path[] = [
  {
    id:          "roots",
    label:       "Roots",
    description: "Family, identity, language, culture, heritage, faith, and belonging.",
    short:       "Family, identity, language, and belonging",
    color:       "text-amber-400",
    bg:          "bg-amber-500/[0.12]",
    border:      "border-amber-400/25",
    dot:         "bg-amber-400",
  },
  {
    id:          "growth",
    label:       "Growth",
    description: "Students, career, mentorship, skills, trades, business, and upward mobility.",
    short:       "Career, mentorship, skills, and opportunity",
    color:       "text-teal-400",
    bg:          "bg-teal-500/[0.12]",
    border:      "border-teal-400/25",
    dot:         "bg-teal-400",
  },
  {
    id:          "living",
    label:       "Living",
    description: "Places, relocation, travel, social connection, hobbies, food, wellness, and everyday diaspora life.",
    short:       "Places, travel, social life, and diaspora living",
    color:       "text-violet-400",
    bg:          "bg-violet-500/[0.12]",
    border:      "border-violet-400/25",
    dot:         "bg-violet-400",
  },
  {
    id:          "leadership",
    label:       "Leadership",
    description: "Mentors, organizers, institution builders, donors, and community stewards.",
    short:       "Mentors, organizers, builders, and stewards",
    color:       "text-rose-400",
    bg:          "bg-rose-500/[0.12]",
    border:      "border-rose-400/25",
    dot:         "bg-rose-400",
  },
];

// ── Focus Area ─────────────────────────────────────────────────────────────────

export interface FocusArea {
  id:     string;
  label:  string;
  pathId: PathId;
}

export const FOCUS_AREAS_BY_PATH: Record<PathId, FocusArea[]> = {
  roots: [
    { id: "family",           label: "Family",           pathId: "roots" },
    { id: "parenting",        label: "Parenting",        pathId: "roots" },
    { id: "marriage",         label: "Marriage",         pathId: "roots" },
    { id: "children",         label: "Children",         pathId: "roots" },
    { id: "language",         label: "Language",         pathId: "roots" },
    { id: "culture",          label: "Culture",          pathId: "roots" },
    { id: "heritage",         label: "Heritage",         pathId: "roots" },
    { id: "faith",            label: "Faith",            pathId: "roots" },
    { id: "schools",          label: "Schools",          pathId: "roots" },
    { id: "regional-identity",label: "Regional Identity",pathId: "roots" },
  ],
  growth: [
    { id: "students",         label: "Students",         pathId: "growth" },
    { id: "early-career",     label: "Early Career",     pathId: "growth" },
    { id: "mentorship",       label: "Mentorship",       pathId: "growth" },
    { id: "skills",           label: "Skills",           pathId: "growth" },
    { id: "trades",           label: "Trades",           pathId: "growth" },
    { id: "finance",          label: "Finance",          pathId: "growth" },
    { id: "entrepreneurship", label: "Entrepreneurship", pathId: "growth" },
    { id: "healthcare",       label: "Healthcare",       pathId: "growth" },
    { id: "technology",       label: "Technology",       pathId: "growth" },
    { id: "networking",       label: "Networking",       pathId: "growth" },
  ],
  living: [
    { id: "places",          label: "Places",          pathId: "living" },
    { id: "social",          label: "Social",          pathId: "living" },
    { id: "travel",          label: "Travel",          pathId: "living" },
    { id: "relocation",      label: "Relocation",      pathId: "living" },
    { id: "hobbies",         label: "Hobbies",         pathId: "living" },
    { id: "wellness",        label: "Wellness",        pathId: "living" },
    { id: "food",            label: "Food",            pathId: "living" },
    { id: "events",          label: "Events",          pathId: "living" },
    { id: "local-discovery", label: "Local Discovery", pathId: "living" },
  ],
  leadership: [
    { id: "organizing",          label: "Organizing",          pathId: "leadership" },
    { id: "chapters",            label: "Chapters",            pathId: "leadership" },
    { id: "nonprofit",           label: "Nonprofit",           pathId: "leadership" },
    { id: "mentorship",          label: "Mentorship",          pathId: "leadership" },
    { id: "advocacy",            label: "Advocacy",            pathId: "leadership" },
    { id: "governance",          label: "Governance",          pathId: "leadership" },
    { id: "donors",              label: "Donors",              pathId: "leadership" },
    { id: "community-building",  label: "Community Building",  pathId: "leadership" },
    { id: "strategy",            label: "Strategy",            pathId: "leadership" },
    { id: "institution-building",label: "Institution Building",pathId: "leadership" },
  ],
};

// ── Place Scope ────────────────────────────────────────────────────────────────
// Used by Living / Places groups to describe geographic scope.

export const PLACE_SCOPES = [
  { value: "City",             label: "City" },
  { value: "Metro",            label: "Metro Area" },
  { value: "Region",           label: "Region" },
  { value: "State / Province", label: "State / Province" },
  { value: "Country",          label: "Country" },
  { value: "Multi-country",    label: "Multi-country" },
  { value: "Global",           label: "Global" },
] as const;

export type PlaceScopeValue = typeof PLACE_SCOPES[number]["value"];

/**
 * Encode Place Scope + Location Label into a single `location_relevance` string.
 * Format: "Country: Australia" — scope always followed by ": " then label.
 * If no scope is provided, returns the label as-is.
 */
export function encodePlaceLocation(scope: string, label: string): string {
  if (!scope) return label;
  if (!label) return scope;
  return `${scope}: ${label}`;
}

/**
 * Decode a `location_relevance` string back into scope + label.
 * Returns null scope if it was not encoded with a known scope prefix.
 */
export function decodePlaceLocation(value: string): { scope: string; label: string } {
  const knownScopes = PLACE_SCOPES.map((s) => s.value);
  for (const scope of knownScopes) {
    const prefix = `${scope}: `;
    if (value.startsWith(prefix)) {
      return { scope, label: value.slice(prefix.length) };
    }
  }
  return { scope: "", label: value };
}

// ── Group Type ─────────────────────────────────────────────────────────────────

export type GroupTypeId =
  | "network"
  | "support"
  | "mentorship"
  | "learning"
  | "local"
  | "leadership"
  | "interest";

export interface GroupType {
  id:          GroupTypeId;
  label:       string;
  description: string;
}

export const GROUP_TYPES: GroupType[] = [
  {
    id:          "network",
    label:       "Network",
    description: "Peer connection, professional circles, industry groups, and broad networking.",
  },
  {
    id:          "support",
    label:       "Support",
    description: "Parenting, family, wellness, relocation, and practical or emotional support.",
  },
  {
    id:          "mentorship",
    label:       "Mentorship",
    description: "Structured guidance, mentor-led groups, and developmental support.",
  },
  {
    id:          "learning",
    label:       "Learning",
    description: "Education, skill-building, courses, training, and knowledge communities.",
  },
  {
    id:          "local",
    label:       "Local",
    description: "Place-based groups tied to where members live now.",
  },
  {
    id:          "leadership",
    label:       "Leadership",
    description: "Organizers, chapter leaders, builders, and institution-level groups.",
  },
  {
    id:          "interest",
    label:       "Interest",
    description: "Hobby, passion, or niche topic communities.",
  },
];

/**
 * Returns the recommended Group Type IDs for a given Focus Area.
 * The first item in the array is the primary suggestion.
 * Falls back to ["network", "support", "interest"] for unknown focus areas.
 */
export function getGroupTypesForFocusArea(focusAreaId: string): GroupTypeId[] {
  const map: Record<string, GroupTypeId[]> = {
    // ── Roots ──────────────────────────────────────────────────────────────
    "family":            ["support", "network", "learning"],
    "parenting":         ["support", "network", "learning"],
    "marriage":          ["support", "network"],
    "children":          ["support", "learning", "local"],
    "language":          ["learning", "network", "leadership"],
    "culture":           ["interest", "network", "learning"],
    "heritage":          ["interest", "network", "learning"],
    "faith":             ["support", "network", "local"],
    "schools":           ["learning", "leadership", "network"],
    "regional-identity": ["network", "interest", "support"],
    // ── Growth ─────────────────────────────────────────────────────────────
    "students":          ["learning", "mentorship", "network"],
    "early-career":      ["network", "mentorship", "learning"],
    "mentorship":        ["mentorship", "network", "learning"],
    "skills":            ["learning", "network", "mentorship"],
    "trades":            ["learning", "network", "interest"],
    "finance":           ["learning", "network", "interest"],
    "entrepreneurship":  ["network", "mentorship", "leadership"],
    "healthcare":        ["network", "learning", "support"],
    "technology":        ["network", "learning", "mentorship"],
    "networking":        ["network", "mentorship", "learning"],
    // ── Living ─────────────────────────────────────────────────────────────
    "places":            ["local", "network", "support"],
    "social":            ["interest", "local", "network"],
    "travel":            ["interest", "support", "network"],
    "relocation":        ["support", "local", "network"],
    "hobbies":           ["interest", "local", "network"],
    "wellness":          ["support", "interest", "network"],
    "food":              ["interest", "local", "network"],
    "events":            ["interest", "local", "network"],
    "local-discovery":   ["local", "interest", "network"],
    // ── Leadership ─────────────────────────────────────────────────────────
    "organizing":           ["leadership", "mentorship", "network"],
    "chapters":             ["leadership", "network"],
    "nonprofit":            ["leadership", "network", "mentorship"],
    "advocacy":             ["leadership", "network", "interest"],
    "governance":           ["leadership", "network"],
    "donors":               ["leadership", "network", "interest"],
    "community-building":   ["leadership", "network", "mentorship"],
    "strategy":             ["leadership", "mentorship", "network"],
    "institution-building": ["leadership", "mentorship", "network"],
  };
  return map[focusAreaId] ?? ["network", "support", "interest"];
}

// ── Event Type ─────────────────────────────────────────────────────────────────

export type EventTypeId =
  | "meetup"
  | "roundtable"
  | "workshop"
  | "crash-course"
  | "networking"
  | "family-event"
  | "cultural-event"
  | "leadership-session"
  | "social"
  | "panel"
  | "webinar"
  | "conference"
  | "community-briefing";

export interface EventType {
  id:    EventTypeId;
  label: string;
}

export const EVENT_TYPES: EventType[] = [
  { id: "meetup",               label: "Meetup"              },
  { id: "roundtable",           label: "Roundtable"          },
  { id: "workshop",             label: "Workshop"            },
  { id: "crash-course",         label: "Crash Course"        },
  { id: "networking",           label: "Networking Event"    },
  { id: "family-event",         label: "Family Event"        },
  { id: "cultural-event",       label: "Cultural Event"      },
  { id: "leadership-session",   label: "Leadership Session"  },
  { id: "social",               label: "Social Gathering"    },
  { id: "panel",                label: "Panel"               },
  { id: "webinar",              label: "Webinar"             },
  { id: "conference",           label: "Conference"          },
  { id: "community-briefing",   label: "Community Briefing"  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Get a Path definition by its ID */
export function getPath(id: PathId): Path {
  return PATHS.find((p) => p.id === id) ?? PATHS[0];
}

/** Get all Focus Areas for a given Path */
export function getFocusAreas(pathId: PathId): FocusArea[] {
  return FOCUS_AREAS_BY_PATH[pathId] ?? [];
}

/** Flat list of all Focus Areas across all Paths */
export const ALL_FOCUS_AREAS: FocusArea[] =
  Object.values(FOCUS_AREAS_BY_PATH).flat();

/** Get a Group Type definition by its ID */
export function getGroupType(id: GroupTypeId): GroupType | undefined {
  return GROUP_TYPES.find((gt) => gt.id === id);
}

/** Get a Focus Area label by its ID (across all paths) */
export function getFocusAreaLabel(id: string): string {
  return ALL_FOCUS_AREAS.find((fa) => fa.id === id)?.label ?? id;
}

// ── Legacy mapping (DB backward compat) ───────────────────────────────────────
// Maps old `groups.category` strings (stored in the DB) → new Path IDs.
// New groups should store path + focus_area directly.

export function legacyCategoryToPath(category: string): PathId {
  switch (category) {
    // Old flat category strings
    case "Parenting & Family":    return "roots";
    case "Culture & Identity":    return "roots";
    case "Career & Professional": return "growth";
    case "Education & Mentorship":return "growth";
    case "Business & Founder":    return "growth";
    case "Industry Circles":      return "growth";
    case "Travel & Lifestyle":    return "living";
    case "City / Region":         return "living";
    case "Special Interest":      return "living";
    // Old compound-string path IDs (first segment before "/")
    case "roots":                 return "roots";
    case "learning":              return "growth";
    case "career":                return "growth";
    case "family":                return "roots";
    case "leadership":            return "leadership";
    case "lifestyle":             return "living";
    default:                      return "living";
  }
}

// ── Old path ID migration ──────────────────────────────────────────────────────
// When reading a compound string from DB, the first segment may be an old PathId.

function migratePathId(raw: string): PathId {
  switch (raw) {
    case "roots":      return "roots";
    case "growth":     return "growth";
    case "living":     return "living";
    case "leadership": return "leadership";
    // Legacy path IDs
    case "learning":   return "growth";
    case "career":     return "growth";
    case "family":     return "roots";
    case "lifestyle":  return "living";
    case "community":  return "living";   // previous taxonomy iteration
    default:           return "living";
  }
}

// ── Old group type ID migration ────────────────────────────────────────────────

function migrateGroupTypeId(raw: string): GroupTypeId {
  const map: Record<string, GroupTypeId> = {
    "professional-circle":     "network",
    "support-circle":          "support",
    "mentorship-circle":       "mentorship",
    "growth-circle":           "learning",
    "learning-circle":         "learning",
    "local-circle":            "local",
    "identity-circle":         "interest",
    "organizer-circle":        "leadership",
    "special-interest-circle": "interest",
  };
  return map[raw] ?? (raw as GroupTypeId);
}

// ── Old focus area migration ───────────────────────────────────────────────────
// Maps focus area IDs that existed in old schema → new schema IDs.

function migrateFocusAreaId(focusArea: string, newPath: PathId): string {
  // Focus areas removed or renamed in the new schema
  const map: Record<string, string> = {
    // Living geography — old split buckets → unified "places"
    "cities":             "places",
    "regions":            "places",
    // Old learning/career focus areas → growth
    "career-discovery":   "early-career",
    "skill-building":     "skills",
    "industry-exposure":  "technology",
    "finance-basics":     "finance",
    "business-basics":    "entrepreneurship",
    "personal-development": "skills",
    "scholarships":       "students",
    "real-estate":        "entrepreneurship",
    "law":                "networking",
    "media":              "networking",
    "hiring":             "networking",
    // Old family focus areas → roots
    "motherhood":         "parenting",
    "fatherhood":         "parenting",
    "home-life":          "family",
    "family-events":      "events",
    "education":          "schools",
    "support":            "parenting",
    "wellness":           newPath === "roots" ? "family" : "wellness",
    // Old roots focus areas
    "diaspora-identity":  "regional-identity",
    "traditions":         "culture",
    "history":            "heritage",
    // Old leadership focus areas
    "community":          "community-building",
    "donorship":          "donors",
    // Old lifestyle focus areas
    "global-living":      "relocation",
    "fitness":            "wellness",
    "local-discovery":    "local-discovery",
  };
  return map[focusArea] ?? focusArea;
}

// ── Taxonomy encoding / decoding ──────────────────────────────────────────────
// New groups store taxonomy as a compound string: "path/focusArea/groupType"
// Legacy groups have plain strings like "Parenting & Family".

export interface ParsedTaxonomy {
  path:      PathId;
  focusArea: string;
  groupType: GroupTypeId | undefined;
}

/** Parse a category string (new compound format OR legacy) into taxonomy fields. */
export function parseTaxonomyCategory(category: string | null | undefined): ParsedTaxonomy {
  if (!category) {
    return { path: "living", focusArea: "", groupType: undefined };
  }
  const parts = category.split("/");
  if (parts.length >= 2) {
    const path      = migratePathId(parts[0]);
    const focusArea = migrateFocusAreaId(parts[1] ?? "", path);
    const groupType = parts[2]
      ? migrateGroupTypeId(parts[2])
      : undefined;
    return { path, focusArea, groupType };
  }
  // Legacy flat string
  return {
    path:      legacyCategoryToPath(category),
    focusArea: legacyCategoryToFocusArea(category),
    groupType: undefined,
  };
}

/** Encode taxonomy fields into the compound category string stored in DB. */
export function buildTaxonomyCategory(
  path: PathId,
  focusArea: string,
  groupType: string,
): string {
  return `${path}/${focusArea}/${groupType}`;
}

/** Maps old category strings → nearest Focus Area ID */
export function legacyCategoryToFocusArea(category: string): string {
  switch (category) {
    case "Parenting & Family":    return "parenting";
    case "Culture & Identity":    return "heritage";
    case "Career & Professional": return "networking";
    case "Education & Mentorship":return "mentorship";
    case "Business & Founder":    return "entrepreneurship";
    case "Industry Circles":      return "networking";
    case "Travel & Lifestyle":    return "travel";
    case "City / Region":         return "cities";
    case "Special Interest":      return "hobbies";
    default:                      return "social";
  }
}
