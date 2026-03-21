// Types for the Interactive Network Feed

// ─── V1 Publishing Enums ─────────────────────────────────────────────────────

/** 3 primary formats — drives composer UI and distribution defaults */
export type ContentType = "post" | "event" | "discussion";

/**
 * Secondary intent tag — only applies to content_type = 'post'.
 * null = plain update (no badge shown on card).
 */
export type PostIntent =
  | "update"
  | "announcement"
  | "opportunity"
  | "job"
  | "volunteer"
  | "fundraiser"
  | null;

/** Who is publishing */
export type SourceType = "user" | "organization" | "business" | "group";

export type PostVisibility = "public" | "followers" | "members";
export type PostStatus = "published" | "draft" | "archived" | "deleted";

// ─── Media ───────────────────────────────────────────────────────────────────

/**
 * One item in a post's media array.
 * Stored as a JSONB array in feed_posts.media_items.
 *
 * DB migration (run once in Supabase SQL editor):
 *   ALTER TABLE feed_posts
 *     ADD COLUMN IF NOT EXISTS media_items JSONB DEFAULT '[]'::jsonb;
 */
export interface PostMediaItem {
  url: string;
  media_type: "photo" | "video";
  order_index: number;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
}

// ─── Shared author relations ─────────────────────────────────────────────────

export interface PostAuthorProfile {
  id?: string | null;
  full_name: string | null;
  username: string | null;
  headline: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

export interface PostAuthorBusiness {
  id?: string | null;
  name: string;
  slug: string;
  business_type: string | null;
  logo_url: string | null;
  is_verified: boolean;
}

export interface PostAuthorOrganization {
  id?: string | null;
  name: string;
  slug: string;
  organization_type: string | null;
  logo_url: string | null;
  is_verified: boolean;
}

// ─── Core Post ───────────────────────────────────────────────────────────────

export interface NetworkPost {
  id: string;
  submitted_by: string;

  // Legacy polymorphic author columns (kept for backward compat)
  author_profile_id: string | null;
  author_business_id: string | null;
  author_organization_id: string | null;

  content: string;
  /** Legacy type field — kept for backward compat, not used in new code */
  post_type: "general" | "opportunity" | "ask";
  /** Legacy single-media field — still written for single-photo backward compat */
  image_url: string | null;
  /** V1 multi-media array — preferred over image_url when present and non-empty */
  media_items?: PostMediaItem[];

  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;

  // ── V1 Publishing System ──────────────────────────────────────────────────
  content_type: ContentType;
  post_intent: PostIntent;
  source_type: SourceType;
  source_id: string | null;
  visibility: PostVisibility;
  distribute_to_pulse: boolean;
  distribute_to_following: boolean;
  display_on_source_wall: boolean;
  linked_group_id: string | null;
  cta_url: string | null;
  cta_label: string | null;
  is_pinned: boolean;
  status: PostStatus;

  // ── Reposting ─────────────────────────────────────────────────────────────
  repost_count?: number;
  original_post_id?: string | null;
  original_post?: NetworkPost | null;

  // ── Joined relations ──────────────────────────────────────────────────────
  author_profile?: PostAuthorProfile;
  author_business?: PostAuthorBusiness;
  author_organization?: PostAuthorOrganization;

  // ── Client state ──────────────────────────────────────────────────────────
  user_reaction_type?: "like" | "heart" | "laugh" | "fire" | "applause" | "smile" | null;
}

// ─── Comment ─────────────────────────────────────────────────────────────────

export interface NetworkComment {
  id: string;
  post_id: string;
  submitted_by: string;

  author_profile_id: string | null;
  author_business_id: string | null;
  author_organization_id: string | null;

  parent_id?: string | null;

  content: string;
  created_at: string;
  updated_at: string;

  author_profile?: PostAuthorProfile;
  author_business?: PostAuthorBusiness;
  author_organization?: PostAuthorOrganization;
}

// ─── Like (legacy) ───────────────────────────────────────────────────────────

export interface NetworkLike {
  id: string;
  post_id: string;
  profile_id: string;
  created_at: string;
}