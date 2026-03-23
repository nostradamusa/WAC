import { supabase } from "@/lib/supabase";
import type { PersonDirectoryRow } from "@/lib/types/person-directory";
import type { BusinessProfile } from "@/lib/types/business-directory";
import type { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";

type EntityCountRow = {
  name: string | null;
  description?: string | null;
  industry_name?: string | null;
  organization_type?: string | null;
  city: string | null;
  country: string | null;
};

function toError(err: unknown, fallbackMessage: string): Error {
  return err instanceof Error ? err : new Error(fallbackMessage);
}

// A combined type matching our new `v_people_directory_enriched` PostgreSQL view
export type EnrichedDirectoryPerson = PersonDirectoryRow & {
  id: string;
  current_company_coalesced: string | null;
  current_title_coalesced: string | null;
  exp_company: string | null;
  exp_title: string | null;
  // We'll normalize the "company" and "current_title" locally just for component compatibility
  company?: string | null;
  current_title?: string | null;
};

export type UserProfileForRelevance = {
  country: string | null;
  state: string | null;
  city: string | null;
  industry_name: string | null;
  skills: string[] | null;
} | null;

export type SearchFilters = {
  q?: string;
  country?: string;
  industry?: string;
  specialty?: string;
  skills?: string[];
  mentorOnly?: boolean;
  openToWork?: boolean;
  openToHire?: boolean;
  openToInvest?: boolean;
  openToCollaborate?: boolean;
};

const STATE_MAP: Record<string, string[]> = {
  al: ["alabama"],
  ak: ["alaska"],
  az: ["arizona"],
  ar: ["arkansas"],
  ca: ["california"],
  co: ["colorado"],
  ct: ["connecticut"],
  de: ["delaware"],
  fl: ["florida"],
  ga: ["georgia"],
  hi: ["hawaii"],
  id: ["idaho"],
  il: ["illinois"],
  in: ["indiana"],
  ia: ["iowa"],
  ks: ["kansas"],
  ky: ["kentucky"],
  la: ["louisiana"],
  me: ["maine"],
  md: ["maryland"],
  ma: ["massachusetts"],
  mi: ["michigan"],
  mn: ["minnesota"],
  ms: ["mississippi"],
  mo: ["missouri"],
  mt: ["montana"],
  ne: ["nebraska"],
  nv: ["nevada"],
  nh: ["new hampshire"],
  nj: ["new jersey"],
  nm: ["new mexico"],
  ny: ["new york"],
  nc: ["north carolina"],
  nd: ["north dakota"],
  oh: ["ohio"],
  ok: ["oklahoma"],
  or: ["oregon"],
  pa: ["pennsylvania"],
  ri: ["rhode island"],
  sc: ["south carolina"],
  sd: ["south dakota"],
  tn: ["tennessee"],
  tx: ["texas"],
  ut: ["utah"],
  vt: ["vermont"],
  va: ["virginia"],
  wa: ["washington"],
  wv: ["west virginia"],
  wi: ["wisconsin"],
  wy: ["wyoming"],
};

/**
 * Normalizes query arrays and executes the Supabase fetch against v_people_directory_enriched.
 * Note: While we pushed the JOIN to the database, true full-text search across all nested fields
 * without a dedicated TSVECTOR column is still challenging in pure PostgREST syntax if we want
 * the exact fuzzy matching behavior as before. For now, we pull the unified view and apply the logic,
 * eliminating the N+1 experience fetch entirely.
 */
export async function getPeopleDirectory(
  filters: SearchFilters,
  currentUserId?: string | null
): Promise<{
  data: EnrichedDirectoryPerson[];
  error: Error | null;
  count: number;
}> {
  try {
    const { data, error } = await supabase.rpc("get_people_directory_scored", {
      p_user_id: currentUserId || null,
      p_country: filters.country || null,
      p_industry: filters.industry || null,
      p_specialty: filters.specialty || null,
      p_mentor_only: filters.mentorOnly || false,
      p_open_to_work: filters.openToWork || false,
      p_open_to_hire: filters.openToHire || false,
      p_open_to_invest: filters.openToInvest || false,
      p_open_to_collaborate: filters.openToCollaborate || false,
      p_search_query: filters.q || null,
      p_skills: filters.skills && filters.skills.length > 0 ? filters.skills : null,
    });

    if (error) throw error;

    let people = (data as EnrichedDirectoryPerson[]).map((p) => ({
      ...p,
      // Map the coalesced values back to standard prop names expected by UI components
      company: p.current_company_coalesced,
      current_title: p.current_title_coalesced,
    }));

    // If there's a custom text query (Global Search logic), perform final in-memory filter
    // until we set up a dedicated materialized TSVECTOR search column.
    if (filters.q) {
      const qClean = filters.q.trim();
      people = people.filter((person) => matchesSearch(person, qClean));
    }

    return { data: people, error: null, count: people.length };
  } catch (err: unknown) {
    console.error("Error fetching people directory:", err);
    return { data: [], error: toError(err, "Failed to fetch people directory"), count: 0 };
  }
}

// Retained Global Search matching algorithm
function matchesSearch(person: EnrichedDirectoryPerson, q: string) {
  const haystack = [
    person.full_name,
    person.username,
    person.headline,
    person.current_title,
    person.profession_name,
    person.profession,
    person.specialty_name,
    person.company,
    person.bio,
    person.city,
    person.state,
    person.country,
    person.industry_name,
    person.ancestry_city,
    person.ancestry_country,
    person.ancestry_village,
    ...(person.skills ?? []),
    person.open_to_mentor ? "mentor mentoring open to mentor" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const cleanQ = q
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    .replace(/\b(in|the|a|an|for|of|at|from)\b/g, " ");

  const terms = cleanQ.split(/\s+/).filter((term) => term.length > 0);

  return terms.every((term) => {
    const expansions = STATE_MAP[term] ? [term, ...STATE_MAP[term]] : [term];
    return expansions.some((exp) => haystack.includes(exp));
  });
}

/**
 * Fetch and filter businesses and organizations simultaneously.
 */
export async function getEntitiesDirectory(filters: SearchFilters): Promise<{
  businesses: BusinessProfile[];
  organizations: OrganizationDirectoryEntry[];
  error?: Error | null;
}> {
  try {
    const [bizRes, orgRes] = await Promise.all([
      supabase.from("businesses_directory_v1").select("*").order("name"),
      supabase.from("organizations_directory_v1").select("*").order("name"),
    ]);

    let businesses = (bizRes.data || []) as BusinessProfile[];
    let organizations = (orgRes.data || []) as OrganizationDirectoryEntry[];

    // Global Text Search (unified matching)
    if (filters.q) {
      const qLower = filters.q.toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .replace(/\b(in|the|a|an|for|of|at|from)\b/g, " ");
      const terms = qLower.split(/\s+/).filter((term) => term.length > 0);

      const matchesTerm = (haystack: string, term: string) => {
        const expansions = STATE_MAP[term] ? [term, ...STATE_MAP[term]] : [term];
        return expansions.some((exp) => haystack.includes(exp));
      };

      businesses = businesses.filter((b) => {
        const haystack = `${b.name || ""} ${b.description || ""} ${b.industry_name || ""} ${b.city || ""} ${b.state || ""} ${b.country || ""}`.toLowerCase();
        return terms.every((term) => matchesTerm(haystack, term));
      });

      organizations = organizations.filter((o) => {
        const haystack = `${o.name || ""} ${o.description || ""} ${o.organization_type || ""} ${o.city || ""} ${o.state || ""} ${o.country || ""}`.toLowerCase();
        return terms.every((term) => matchesTerm(haystack, term));
      });
    }

    // Exact Match Filters
    if (filters.country) {
      const c = filters.country.toLowerCase();
      businesses = businesses.filter((b) => b.country?.toLowerCase() === c);
      organizations = organizations.filter((o) => o.country?.toLowerCase() === c);
    }

    if (filters.industry) {
      const ind = filters.industry.toLowerCase();
      businesses = businesses.filter((b) => b.industry_name?.toLowerCase() === ind);
      // organizations don't strictly have 'industry_name', but if they want to match on it we could or skip
    }

    return { businesses, organizations, error: null };
  } catch (err: unknown) {
    console.error("Error fetching entities directory:", err);
    return { businesses: [], organizations: [], error: toError(err, "Failed to fetch entities directory") };
  }
}

// ─────────────────────────────────────────────
// Search History  (localStorage primary, Supabase sync when available)
// ─────────────────────────────────────────────

export type RecentlyViewedItem = {
  id: string;
  entity_id: string;
  entity_type: "profile" | "business" | "organization";
  name: string;
  avatar_url: string | null;
  username_or_slug: string | null;
  verified: boolean;
  viewed_at: string;
};

export type SearchHistoryItem = {
  id: string;
  term: string;
  searched_at: string;
};

const LS_HISTORY_KEY = "wac_search_history";
const LS_VIEWED_KEY  = "wac_recently_viewed";
const MAX_LS_ITEMS   = 20;

function lsGet<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}

function lsSet<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(items)); } catch { /* quota */ }
}

export async function getRecentlyViewed(limit = 20): Promise<RecentlyViewedItem[]> {
  // Try DB first; fall back to localStorage
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("recently_viewed")
        .select("id, entity_id, entity_type, name, avatar_url, username_or_slug, verified, viewed_at")
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(limit);
      if (!error && data?.length) return data as RecentlyViewedItem[];
    }
  } catch { /* fall through */ }
  return lsGet<RecentlyViewedItem>(LS_VIEWED_KEY).slice(0, limit);
}

export async function saveRecentlyViewed(item: Omit<RecentlyViewedItem, "id" | "viewed_at">): Promise<void> {
  const entry: RecentlyViewedItem = { ...item, id: item.entity_id, viewed_at: new Date().toISOString() };

  // Always update localStorage immediately
  const existing = lsGet<RecentlyViewedItem>(LS_VIEWED_KEY)
    .filter(v => !(v.entity_id === item.entity_id && v.entity_type === item.entity_type));
  lsSet(LS_VIEWED_KEY, [entry, ...existing].slice(0, MAX_LS_ITEMS));

  // Best-effort DB sync
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("recently_viewed").upsert(
        { user_id: user.id, ...item, viewed_at: entry.viewed_at },
        { onConflict: "user_id,entity_id,entity_type" }
      );
    }
  } catch { /* non-blocking */ }
}

export async function getSearchHistory(limit = 20): Promise<SearchHistoryItem[]> {
  // Try DB first; fall back to localStorage
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("search_history")
        .select("id, term, searched_at")
        .eq("user_id", user.id)
        .order("searched_at", { ascending: false })
        .limit(limit);
      if (!error && data?.length) return data as SearchHistoryItem[];
    }
  } catch { /* fall through */ }
  return lsGet<SearchHistoryItem>(LS_HISTORY_KEY).slice(0, limit);
}

export async function saveSearchTerm(term: string): Promise<void> {
  const trimmed = term.trim();
  if (!trimmed) return;

  const entry: SearchHistoryItem = { id: Date.now().toString(), term: trimmed, searched_at: new Date().toISOString() };

  // Always update localStorage immediately
  const existing = lsGet<SearchHistoryItem>(LS_HISTORY_KEY)
    .filter(h => h.term.toLowerCase() !== trimmed.toLowerCase());
  lsSet(LS_HISTORY_KEY, [entry, ...existing].slice(0, MAX_LS_ITEMS));

  // Best-effort DB sync
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("search_history").upsert(
        { user_id: user.id, term: trimmed, searched_at: entry.searched_at },
        { onConflict: "user_id,lower(trim(term))" }
      );
    }
  } catch { /* non-blocking */ }
}

export async function deleteSearchTerm(id: string): Promise<void> {
  // Remove from localStorage
  const existing = lsGet<SearchHistoryItem>(LS_HISTORY_KEY).filter(h => h.id !== id);
  lsSet(LS_HISTORY_KEY, existing);

  // Best-effort DB removal
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("search_history").delete().eq("id", id).eq("user_id", user.id);
    }
  } catch { /* non-blocking */ }
}

/**
 * Quick server-side count for cross-tab badges.
 */
export async function getEntitiesCount(q: string): Promise<number> {
  if (!q) return 0;

  try {
    const [bizRes, orgRes] = await Promise.all([
      supabase
        .from("businesses_directory_v1")
        .select("name, description, industry_name, city, country"),
      supabase
        .from("organizations_directory_v1")
        .select("name, description, organization_type, city, country"),
    ]);

    const qLower = q.toLowerCase();
    let count = 0;

    if (bizRes.data) {
      count += (bizRes.data as EntityCountRow[]).filter((b) => {
        const searchString =
          `${b.name || ""} ${b.description || ""} ${b.industry_name || ""} ${b.city || ""} ${b.country || ""}`.toLowerCase();
        return searchString.includes(qLower);
      }).length;
    }

    if (orgRes.data) {
      count += (orgRes.data as EntityCountRow[]).filter((o) => {
        const searchString =
          `${o.name || ""} ${o.description || ""} ${o.organization_type || ""} ${o.city || ""} ${o.country || ""}`.toLowerCase();
        return searchString.includes(qLower);
      }).length;
    }

    return count;
  } catch (err) {
    console.error("Error getting entities count:", err);
    return 0;
  }
}
