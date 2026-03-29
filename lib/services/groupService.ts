import { supabase } from "@/lib/supabase";
import type { GroupData } from "@/lib/types/group";
import { legacyCategoryToPath, getPath } from "@/lib/constants/taxonomy";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GroupListItem {
  id:          string;
  slug:        string;
  name:        string;
  category:    string;
  description: string | null;
  member_count: number;
  privacy:     string;
  join_policy: string;
  created_at:  string;
  tags:        string[];
}

export interface CreateGroupInput {
  name:               string;
  tagline:            string;
  description:        string;
  category:           string;
  tags:               string;        // comma-separated string from form
  location_relevance: string;
  privacy:            "public" | "private" | "secret";
  join_policy:        "open" | "request" | "invite_only";
  linked_org_id:      string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 60);
}

// ── createGroup ───────────────────────────────────────────────────────────────

export async function createGroup(
  input: CreateGroupInput,
): Promise<{ data: GroupListItem | null; error: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const base = slugify(input.name);
  // Append a short random suffix to guarantee uniqueness without a round-trip check
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;

  const tagsArray = input.tags
    ? input.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      slug,
      name:               input.name,
      tagline:            input.tagline   || null,
      description:        input.description || null,
      category:           input.category,
      tags:               tagsArray,
      location_relevance: input.location_relevance || null,
      privacy:            input.privacy,
      join_policy:        input.join_policy,
      linked_org_id:      input.linked_org_id,
      created_by:         user.id,
      member_count:       1,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  // Insert creator as owner
  await supabase.from("group_members").insert({
    group_id:   group.id,
    profile_id: user.id,
    role:       "owner",
    status:     "active",
  });

  return { data: group as GroupListItem, error: null };
}

// ── getGroups ─────────────────────────────────────────────────────────────────

export async function getGroups(category?: string): Promise<GroupListItem[]> {
  let query = supabase
    .from("groups")
    .select("id, slug, name, category, description, member_count, privacy, join_policy, created_at, tags")
    .neq("privacy", "secret")
    .order("created_at", { ascending: false })
    .limit(100);

  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getGroups error:", error);
    return [];
  }
  return (data as GroupListItem[]) || [];
}

// ── updateGroup ───────────────────────────────────────────────────────────────

export async function updateGroup(
  groupId: string,
  input: Partial<Omit<CreateGroupInput, "linked_org_id"> & { linked_org_id: string | null }>,
): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.name               !== undefined) patch.name               = input.name;
  if (input.tagline            !== undefined) patch.tagline            = input.tagline || null;
  if (input.description        !== undefined) patch.description        = input.description || null;
  if (input.category           !== undefined) patch.category           = input.category;
  if (input.location_relevance !== undefined) patch.location_relevance = input.location_relevance || null;
  if (input.privacy            !== undefined) patch.privacy            = input.privacy;
  if (input.join_policy        !== undefined) patch.join_policy        = input.join_policy;
  if (input.linked_org_id      !== undefined) patch.linked_org_id      = input.linked_org_id;
  if (input.tags               !== undefined) {
    patch.tags = input.tags.split(",").map(t => t.trim()).filter(Boolean);
  }

  const { error } = await supabase
    .from("groups")
    .update(patch)
    .eq("id", groupId);

  if (error) return { error: error.message };
  return { error: null };
}

// ── getGroupBySlug ────────────────────────────────────────────────────────────

export async function getGroupBySlug(slug: string): Promise<GroupData | null> {
  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      linked_org:organizations!linked_org_id(name, slug)
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  // Derive avatar colors from category (mirrors GroupsHub pathway mapping)
  const { avatarBg, avatarColor } = categoryToColors(data.category);

  return {
    id:               data.id,
    slug:             data.slug,
    name:             data.name,
    tagline:          data.tagline ?? null,
    description:      data.description ?? "",
    category:         data.category,
    pathway:          categoryToPathway(data.category),
    privacy:          data.privacy,
    join_policy:      data.join_policy,
    member_count:     data.member_count,
    activity_summary: "Active",
    created_at:       data.created_at,
    avatar_bg:        avatarBg,
    avatar_color:     avatarColor,
    avatar_url:       data.avatar_url ?? null,
    banner_url:       data.banner_url ?? null,
    parent_org_name:  data.linked_org?.name  ?? null,
    parent_org_slug:  data.linked_org?.slug  ?? null,
    location_relevance: data.location_relevance ?? null,
    tags:             data.tags ?? [],
    rules:            [],
    members:          [],
    posts:            [],
    events:           [],
    media:            [],
    files:            [],
    is_member:        false,
    current_user_role: null,
  };
}

// ── Utility maps ──────────────────────────────────────────────────────────────

/**
 * @deprecated Use legacyCategoryToPath from @/lib/constants/taxonomy instead.
 * Kept for backward compatibility with getGroupBySlug + GroupData.pathway.
 */
export function categoryToPathway(
  category: string,
): string {
  return legacyCategoryToPath(category);
}

/** Maps a DB category string to Path-based avatar colors via the taxonomy. */
function categoryToColors(category: string): { avatarBg: string; avatarColor: string } {
  const path = getPath(legacyCategoryToPath(category));
  return { avatarBg: path.bg, avatarColor: path.color };
}
