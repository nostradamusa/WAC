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

export interface VoiceNoteMetadata {
  type: "voice_note";
  audio_url: string;
  duration_seconds: number;
  mime_type: string;
  waveform?: number[]; // normalized 0-1 amplitude samples
}

export interface AttachmentMetadata {
  type: "attachment";
  file_url: string;
  file_name: string;
  file_size: number; // bytes
  mime_type: string;
  width?: number;  // for images/video
  height?: number;
}

// Future types — add here when ready, never inline elsewhere.
// export interface EventCardMetadata { type: "event_card"; ... }
// export interface GroupCardMetadata { type: "group_card"; ... }

export type MessageMetadata =
  | EntityCardMetadata
  | VoiceNoteMetadata
  | AttachmentMetadata;

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

export function isVoiceNote(meta: unknown): meta is VoiceNoteMetadata {
  if (!meta || typeof meta !== "object") return false;
  const m = meta as Record<string, unknown>;
  return m.type === "voice_note" && typeof m.audio_url === "string" && typeof m.duration_seconds === "number";
}

export function isAttachment(meta: unknown): meta is AttachmentMetadata {
  if (!meta || typeof meta !== "object") return false;
  const m = meta as Record<string, unknown>;
  return m.type === "attachment" && typeof m.file_url === "string" && typeof m.file_name === "string";
}

export function isImageAttachment(meta: unknown): meta is AttachmentMetadata {
  return isAttachment(meta) && meta.mime_type.startsWith("image/");
}

export function isValidMetadata(meta: unknown): meta is MessageMetadata {
  return isEntityCard(meta) || isVoiceNote(meta) || isAttachment(meta);
}

// ── Label extraction (for search indexing) ───────────────────────────────────

export function metadataSearchLabel(meta: MessageMetadata | null | undefined): string {
  if (!meta) return "";
  if (isEntityCard(meta)) return [meta.name, meta.entity_type, meta.headline].filter(Boolean).join(" ");
  if (isVoiceNote(meta)) return "Voice note";
  if (isAttachment(meta)) return meta.file_name;
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

export function buildVoiceNotePayload(
  audioUrl: string,
  durationSeconds: number,
  mimeType: string,
  waveform?: number[],
): VoiceNoteMetadata {
  return {
    type: "voice_note",
    audio_url: audioUrl,
    duration_seconds: durationSeconds,
    mime_type: mimeType,
    ...(waveform ? { waveform } : {}),
  };
}

export function buildAttachmentPayload(
  fileUrl: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  opts?: { width?: number; height?: number },
): AttachmentMetadata {
  return {
    type: "attachment",
    file_url: fileUrl,
    file_name: fileName,
    file_size: fileSize,
    mime_type: mimeType,
    ...(opts?.width ? { width: opts.width } : {}),
    ...(opts?.height ? { height: opts.height } : {}),
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
