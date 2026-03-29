/**
 * Structured metadata types for rich messages.
 *
 * All metadata shapes must be defined here. Do not create ad hoc
 * metadata shapes elsewhere in the codebase.
 */

// ── Supported card types ─────────────────────────────────────────────────────

export interface EntityCardMetadata {
  type: "entity_card";
  entity_type: "person" | "business" | "organization";
  entity_id: string;
  name: string;
  avatar_url?: string;
  headline?: string;
  url: string;
}

// Future types — add here when ready, never inline elsewhere.
// export interface EventCardMetadata { type: "event_card"; ... }
// export interface GroupCardMetadata { type: "group_card"; ... }
// export interface AvailabilityCardMetadata { type: "availability_card"; ... }
// export interface CalendarProposalMetadata { type: "calendar_proposal"; ... }

export type MessageMetadata = EntityCardMetadata; // union as more types are added

// ── Type guards ──────────────────────────────────────────────────────────────

export function isEntityCard(meta: unknown): meta is EntityCardMetadata {
  if (!meta || typeof meta !== "object") return false;
  const m = meta as Record<string, unknown>;
  return (
    m.type === "entity_card" &&
    typeof m.entity_id === "string" &&
    typeof m.name === "string" &&
    typeof m.url === "string" &&
    ["person", "business", "organization"].includes(m.entity_type as string)
  );
}

export function isValidMetadata(meta: unknown): meta is MessageMetadata {
  return isEntityCard(meta);
}

// ── Label extraction (for search indexing) ───────────────────────────────────

export function metadataSearchLabel(meta: MessageMetadata | null | undefined): string {
  if (!meta) return "";
  if (isEntityCard(meta)) {
    return [meta.name, meta.entity_type, meta.headline].filter(Boolean).join(" ");
  }
  return "";
}

// ── Payload builders ─────────────────────────────────────────────────────────

export function buildEntityCardPayload(
  entityType: "person" | "business" | "organization",
  entityId: string,
  name: string,
  url: string,
  opts?: { avatar_url?: string; headline?: string },
): EntityCardMetadata {
  return {
    type: "entity_card",
    entity_type: entityType,
    entity_id: entityId,
    name,
    url,
    ...(opts?.avatar_url ? { avatar_url: opts.avatar_url } : {}),
    ...(opts?.headline ? { headline: opts.headline } : {}),
  };
}

// ── Fallback-safe accessor ───────────────────────────────────────────────────

/**
 * Safely parse metadata from a DB row. Returns null for invalid shapes
 * instead of letting malformed JSONB propagate through the UI.
 */
export function parseMetadata(raw: unknown): MessageMetadata | null {
  if (!raw) return null;
  if (isValidMetadata(raw)) return raw;
  return null;
}
