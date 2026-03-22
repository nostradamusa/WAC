import type { EnrichedDirectoryPerson } from "@/lib/services/searchService";
import type { BusinessProfile } from "@/lib/types/business-directory";
import type { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import PersonCard from "@/components/people/results/PersonCard";
import BusinessCard from "@/components/businesses/results/BusinessCard";
import OrganizationCard from "@/components/organizations/results/OrganizationCard";
import DirectoryRow, { type DirectoryRowProps } from "@/components/directory/DirectoryRow";
import DirectoryCompactCard, { type DirectoryCompactCardProps } from "@/components/directory/DirectoryCompactCard";
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

// ── Entity → DirectoryCompactCard adapters ───────────────────────────────────

function personCompact(p: EnrichedDirectoryPerson): DirectoryCompactCardProps {
  const name = p.full_name || p.username || "Member";
  return {
    href:         p.username ? `/people/${p.username}` : "#",
    name,
    avatarUrl:    p.avatar_url,
    initials:     mkInitials(name),
    entityKind:   "person",
    line2:        p.headline?.trim() || p.profession_name?.trim() || p.specialty_name?.trim() || undefined,
    line3:        loc(p.city, p.state, abbrevCountry(p.country)) || undefined,
    isVerified:   p.is_verified,
    verifiedType: "person",
  };
}

function bizCompact(b: BusinessProfile): DirectoryCompactCardProps {
  return {
    href:         `/businesses/${b.slug}`,
    name:         b.name,
    avatarUrl:    b.logo_url,
    initials:     mkInitials(b.name),
    entityKind:   "business",
    line2:        b.industry_name?.trim() || b.business_type?.trim() || undefined,
    line3:        loc(b.city, b.state, abbrevCountry(b.country)) || undefined,
    isVerified:   b.is_verified,
    verifiedType: "business",
  };
}

function orgCompact(o: OrganizationDirectoryEntry): DirectoryCompactCardProps {
  return {
    href:         `/organizations/${o.slug}`,
    name:         o.name,
    avatarUrl:    o.logo_url,
    initials:     mkInitials(o.name),
    entityKind:   "organization",
    line2:        o.organization_type?.trim() || undefined,
    line3:        loc(o.city, o.state, abbrevCountry(o.country)) || undefined,
    isVerified:   o.is_verified,
    verifiedType: "organization",
  };
}

// ── Entity → DirectoryRow adapters ───────────────────────────────────────────

function personRow(p: EnrichedDirectoryPerson): DirectoryRowProps {
  const name = p.full_name || p.username || "Member";
  return {
    href:         p.username ? `/people/${p.username}` : "#",
    name,
    avatarUrl:    p.avatar_url,
    initials:     mkInitials(name),
    entityKind:   "person",
    line2:        p.headline?.trim() || p.profession_name?.trim() || p.specialty_name?.trim() || undefined,
    line3:        loc(p.city, p.state, abbrevCountry(p.country)) || undefined,
    isVerified:   p.is_verified,
    verifiedType: "person",
  };
}

function bizRow(b: BusinessProfile): DirectoryRowProps {
  return {
    href:         `/businesses/${b.slug}`,
    name:         b.name,
    avatarUrl:    b.logo_url,
    initials:     mkInitials(b.name),
    entityKind:   "business",
    line2:        b.industry_name?.trim() || b.business_type?.trim() || undefined,
    line3:        loc(b.city, b.state, abbrevCountry(b.country)) || undefined,
    isVerified:   b.is_verified,
    verifiedType: "business",
  };
}

function orgRow(o: OrganizationDirectoryEntry): DirectoryRowProps {
  return {
    href:         `/organizations/${o.slug}`,
    name:         o.name,
    avatarUrl:    o.logo_url,
    initials:     mkInitials(o.name),
    entityKind:   "organization",
    line2:        o.organization_type?.trim() || undefined,
    line3:        loc(o.city, o.state, abbrevCountry(o.country)) || undefined,
    isVerified:   o.is_verified,
    verifiedType: "organization",
  };
}

// ── Compact row list wrapper ──────────────────────────────────────────────────

function RowList({ items }: { items: DirectoryRowProps[] }) {
  return (
    <div className="wac-card p-0 overflow-hidden px-3">
      {items.map((props) => (
        <DirectoryRow key={props.href} {...props} />
      ))}
    </div>
  );
}

// ── 2-column compact grid (mobile) ────────────────────────────────────────────

function CompactGrid({ items }: { items: DirectoryCompactCardProps[] }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((props) => (
        <DirectoryCompactCard key={props.href} {...props} />
      ))}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type UnifiedResultsProps = {
  query?: string;
  scope: "all" | "people" | "businesses" | "organizations";
  people: EnrichedDirectoryPerson[];
  businesses: BusinessProfile[];
  organizations: OrganizationDirectoryEntry[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function UnifiedResults({
  query,
  scope,
  people,
  businesses,
  organizations,
}: UnifiedResultsProps) {

  const totalResults = people.length + businesses.length + organizations.length;

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
  // Mobile: compact rows. Desktop: card grid.

  if (scope === "people") return (
    <>
      <div className="md:hidden">
        <CompactGrid items={people.map(personCompact)} />
      </div>
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {people.map((p) => <PersonCard key={p.id} person={p} />)}
      </div>
    </>
  );

  if (scope === "businesses") return (
    <>
      <div className="md:hidden">
        <CompactGrid items={businesses.map(bizCompact)} />
      </div>
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {businesses.map((b) => <BusinessCard key={b.id} business={b} />)}
      </div>
    </>
  );

  if (scope === "organizations") return (
    <>
      <div className="md:hidden">
        <CompactGrid items={organizations.map(orgCompact)} />
      </div>
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {organizations.map((o) => <OrganizationCard key={o.id} organization={o} />)}
      </div>
    </>
  );

  // ── scope === "all" ───────────────────────────────────────────────────────

  const topPeople = people.slice(0, 2);
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
      {/*
        Top matches use full Entity Cards on all screen sizes — this is the
        richest display treatment for the highest-relevance results.
      */}
      {hasTopMatches && (
        <section>
          <SectionLabel label={topMatchLabel} variant="featured" className="mb-4" />
          {/* Mobile: 2-col compact grid */}
          <div className="md:hidden">
            <CompactGrid items={[
              ...topPeople.map(personCompact),
              ...topBiz.map(bizCompact),
              ...topOrgs.map(orgCompact),
            ]} />
          </div>
          {/* Desktop: full entity cards */}
          <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {topPeople.map((p) => <PersonCard key={p.id} person={p} />)}
            {topBiz.map((b)    => <BusinessCard key={b.id} business={b} />)}
            {topOrgs.map((o)   => <OrganizationCard key={o.id} organization={o} />)}
          </div>
        </section>
      )}

      {/* ── People ───────────────────────────────────────────────────── */}
      {/*
        Secondary sections: compact rows on mobile (scan-optimized),
        full Entity Cards on desktop (detail-optimized).
      */}
      {restPeople.length > 0 && (
        <section>
          <SectionLabel
            label={hasTopMatches ? "More People" : "People"}
            action={{ label: "View all", href: buildScopeUrl(query, "people") }}
            className="mb-4"
          />
          <div className="md:hidden">
            <CompactGrid items={restPeople.map(personCompact)} />
          </div>
          <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restPeople.map((p) => <PersonCard key={p.id} person={p} />)}
          </div>
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
          <div className="md:hidden">
            <CompactGrid items={restBiz.map(bizCompact)} />
          </div>
          <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restBiz.map((b) => <BusinessCard key={b.id} business={b} />)}
          </div>
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
          <div className="md:hidden">
            <CompactGrid items={restOrgs.map(orgCompact)} />
          </div>
          <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restOrgs.map((o) => <OrganizationCard key={o.id} organization={o} />)}
          </div>
        </section>
      )}

    </div>
  );
}
