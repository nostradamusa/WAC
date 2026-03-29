import type { EnrichedDirectoryPerson } from "@/lib/services/searchService";
import type { BusinessProfile } from "@/lib/types/business-directory";
import type { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import type { EnrichedProperty } from "@/lib/types/property-directory";
import DirectoryCompactCard, { type DirectoryCompactCardProps, type EntitySignal } from "@/components/directory/DirectoryCompactCard";
import PropertyCard from "@/components/directory/PropertyCard";
import SectionLabel from "@/components/ui/SectionLabel";
import { Search } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function abbrevCountry(c: string | null | undefined): string {
  if (!c) return "";
  const n = c.trim().toLowerCase();
  if (n === "united states" || n === "united states of america" || n === "usa") return "USA";
  if (n === "united kingdom" || n === "uk") return "UK";
  return c;
}

function loc(...parts: (string | null | undefined)[]) {
  return parts.map((p) => p?.trim()).filter(Boolean).join(", ");
}

// Preserve query when navigating to a scoped view from "all"
function buildScopeUrl(query: string | undefined, scope: string): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("scope", scope);
  return `/directory?${params.toString()}`;
}

// ── Signal helpers ────────────────────────────────────────────────────────────

function getPersonSignal(p: EnrichedDirectoryPerson): EntitySignal | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = p as any;
  if (d.open_to_work)        return { label: "Open to Work",  colorClass: "bg-green-500/10 text-green-400" };
  if (d.open_to_hire)        return { label: "Hiring",        colorClass: "bg-purple-500/10 text-purple-400" };
  if (d.open_to_mentor)      return { label: "Mentoring",     colorClass: "bg-blue-500/10 text-blue-400" };
  if (d.open_to_invest)      return { label: "Investing",     colorClass: "bg-amber-500/10 text-amber-400" };
  if (d.open_to_collaborate) return { label: "Collab",        colorClass: "bg-rose-500/10 text-rose-400" };
  return undefined;
}

function getBizSignal(b: BusinessProfile): EntitySignal | undefined {
  const hiring = b.hiring_status === "hiring" || b.hiring_status === "actively_hiring";
  if (hiring) return { label: "Hiring", colorClass: "bg-green-500/10 text-green-400" };
  return undefined;
}

// ── Entity → DirectoryCompactCard adapters ───────────────────────────────────

function personCompact(p: EnrichedDirectoryPerson): DirectoryCompactCardProps {
  const name = p.full_name || p.username || "Member";
  return {
    href:       p.username ? `/people/${p.username}` : "#",
    name,
    avatarUrl:  p.avatar_url,
    initials:   mkInitials(name),
    entityKind: "person",
    line2:      p.headline?.trim() || p.profession_name?.trim() || p.specialty_name?.trim() || undefined,
    line3:      loc(p.city, p.state, abbrevCountry(p.country)) || undefined,
    isVerified: p.is_verified,
    signal:     getPersonSignal(p),
  };
}

function bizCompact(b: BusinessProfile): DirectoryCompactCardProps {
  return {
    href:       `/businesses/${b.slug}`,
    name:       b.name,
    avatarUrl:  b.logo_url,
    initials:   mkInitials(b.name),
    entityKind: "business",
    line2:      b.industry_name?.trim() || b.business_type?.trim() || undefined,
    line3:      loc(b.city, b.state, abbrevCountry(b.country)) || undefined,
    isVerified: b.is_verified,
    signal:     getBizSignal(b),
  };
}

function orgCompact(o: OrganizationDirectoryEntry): DirectoryCompactCardProps {
  return {
    href:       `/organizations/${o.slug}`,
    name:       o.name,
    avatarUrl:  o.logo_url,
    initials:   mkInitials(o.name),
    entityKind: "organization",
    line2:      o.organization_type?.trim() || undefined,
    line3:      loc(o.city, o.state, abbrevCountry(o.country)) || undefined,
    isVerified: o.is_verified,
  };
}

// ── Responsive compact grid — 2 → 3 → 4 columns ──────────────────────────────

function CompactGrid({ items }: { items: DirectoryCompactCardProps[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
      {items.map((props) => (
        <DirectoryCompactCard key={props.href} {...props} />
      ))}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type UnifiedResultsProps = {
  query?: string;
  scope: "all" | "people" | "businesses" | "organizations" | "properties";
  people: EnrichedDirectoryPerson[];
  businesses: BusinessProfile[];
  organizations: OrganizationDirectoryEntry[];
  properties?: EnrichedProperty[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function UnifiedResults({
  query,
  scope,
  people,
  businesses,
  organizations,
  properties = [],
}: UnifiedResultsProps) {

  const totalResults = people.length + businesses.length + organizations.length + properties.length;

  // ── Empty state ───────────────────────────────────────────────────────────

  if (totalResults === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search className="w-8 h-8 text-white/20 mb-4" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-white/50 mb-1.5">No results found</h3>
        <p className="text-sm text-white/30 max-w-sm leading-relaxed">
          Try adjusting your search or removing filters to broaden your results.
        </p>
        <a
          href="/directory"
          className="mt-5 text-xs text-white/40 hover:text-white/65 transition-colors border border-white/[0.12] rounded-full px-4 py-1.5"
        >
          Clear all filters
        </a>
      </div>
    );
  }

  // ── Single-scope views ────────────────────────────────────────────────────

  if (scope === "people") return (
    <CompactGrid items={people.map(personCompact)} />
  );

  if (scope === "businesses") return (
    <CompactGrid items={businesses.map(bizCompact)} />
  );

  if (scope === "organizations") return (
    <CompactGrid items={organizations.map(orgCompact)} />
  );

  if (scope === "properties") return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );

  // ── scope === "all" ───────────────────────────────────────────────────────

  const topPeople = people.slice(0, 4);
  const topBiz    = businesses.slice(0, 2);
  const topOrgs   = organizations.slice(0, 2);

  const hasTopMatches = topPeople.length > 0 || topBiz.length > 0 || topOrgs.length > 0;

  const topMatchLabel = query ? "Top Matches" : "Suggested for You";

  const restPeople = people.slice(topPeople.length);
  const restBiz    = businesses.slice(topBiz.length);
  const restOrgs   = organizations.slice(topOrgs.length);

  return (
    <div className="w-full space-y-10">

      {/* ── Featured / top matches ────────────────────────────────────── */}
      {hasTopMatches && (
        <section>
          <SectionLabel label={topMatchLabel} variant="featured" className="mb-4" />
          <CompactGrid items={[
            ...topPeople.map(personCompact),
            ...topBiz.map(bizCompact),
            ...topOrgs.map(orgCompact),
          ]} />
        </section>
      )}

      {/* ── People ───────────────────────────────────────────────────── */}
      {restPeople.length > 0 && (
        <section>
          <SectionLabel
            label={hasTopMatches ? "More People" : "People"}
            action={{ label: "View all", href: buildScopeUrl(query, "people") }}
            className="mb-4"
          />
          <CompactGrid items={restPeople.map(personCompact)} />
        </section>
      )}

      {/* ── Businesses ───────────────────────────────────────────────── */}
      {restBiz.length > 0 && (
        <section>
          <SectionLabel
            label={hasTopMatches ? "More Businesses" : "Businesses"}
            action={{ label: "View all", href: buildScopeUrl(query, "businesses") }}
            className="mb-4"
          />
          <CompactGrid items={restBiz.map(bizCompact)} />
        </section>
      )}

      {/* ── Organizations ────────────────────────────────────────────── */}
      {restOrgs.length > 0 && (
        <section>
          <SectionLabel
            label={hasTopMatches ? "More Organizations" : "Organizations"}
            action={{ label: "View all", href: buildScopeUrl(query, "organizations") }}
            className="mb-4"
          />
          <CompactGrid items={restOrgs.map(orgCompact)} />
        </section>
      )}

    </div>
  );
}
