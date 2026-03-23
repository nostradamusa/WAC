export type HostEntityType = "organization" | "business" | "group";
export type EventHostMode = "person" | HostEntityType;

export type EventPersonSnapshot = {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  headline?: string | null;
};

export type EventEntitySnapshot = {
  id: string;
  type: HostEntityType;
  name: string;
  slug: string | null;
  role?: string | null;
};

export type EventHostingMetadata = {
  version: 1;
  host_mode: EventHostMode;
  primary_host: EventPersonSnapshot | null;
  host_entity: EventEntitySnapshot | null;
  representative: EventPersonSnapshot | null;
  co_hosts: EventPersonSnapshot[];
  linked_entity: EventEntitySnapshot | null;
};

const VALID_HOST_ENTITY_TYPES: HostEntityType[] = ["organization", "business", "group"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePersonSnapshot(value: unknown): EventPersonSnapshot | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    username: typeof value.username === "string" ? value.username : null,
    avatar_url: typeof value.avatar_url === "string" ? value.avatar_url : null,
    headline: typeof value.headline === "string" ? value.headline : null,
  };
}

function normalizeEntitySnapshot(value: unknown): EventEntitySnapshot | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.type !== "string" ||
    !VALID_HOST_ENTITY_TYPES.includes(value.type as HostEntityType)
  ) {
    return null;
  }

  return {
    id: value.id,
    type: value.type as HostEntityType,
    name: value.name,
    slug: typeof value.slug === "string" ? value.slug : null,
    role: typeof value.role === "string" ? value.role : null,
  };
}

export function normalizeEventHostingMetadata(value: unknown): EventHostingMetadata {
  if (!isRecord(value)) {
    return {
      version: 1,
      host_mode: "person",
      primary_host: null,
      host_entity: null,
      representative: null,
      co_hosts: [],
      linked_entity: null,
    };
  }

  const hostMode =
    typeof value.host_mode === "string" &&
    (value.host_mode === "person" || VALID_HOST_ENTITY_TYPES.includes(value.host_mode as HostEntityType))
      ? (value.host_mode as EventHostMode)
      : "person";

  const coHosts = Array.isArray(value.co_hosts)
    ? value.co_hosts.map(normalizePersonSnapshot).filter((person): person is EventPersonSnapshot => !!person)
    : [];

  return {
    version: 1,
    host_mode: hostMode,
    primary_host: normalizePersonSnapshot(value.primary_host),
    host_entity: normalizeEntitySnapshot(value.host_entity),
    representative: normalizePersonSnapshot(value.representative),
    co_hosts: coHosts,
    linked_entity: normalizeEntitySnapshot(value.linked_entity),
  };
}
