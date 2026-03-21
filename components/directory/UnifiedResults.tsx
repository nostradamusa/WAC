import type { EnrichedDirectoryPerson } from "@/lib/services/searchService";
import type { BusinessProfile } from "@/lib/types/business-directory";
import type { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import type { EventDirectoryEntry } from "@/lib/types/event-directory";
import PersonCard from "@/components/people/results/PersonCard";
import BusinessCard from "@/components/businesses/results/BusinessCard";
import OrganizationCard from "@/components/organizations/results/OrganizationCard";
import EventCard from "@/components/events/results/EventCard";
import DirectoryRow, { type DirectoryRowProps } from "@/components/directory/DirectoryRow";
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

function eventRow(e: EventDirectoryEntry): DirectoryRowProps {
  return {
    href:       `/events/${e.slug}`,
    name:       e.name,
    avatarUrl:  undefined,
    initials:   "",
    entityKind: "event",
    line2:      e.date,
    line3:      loc(e.city, e.state, abbrevCountry(e.country)) || e.location || undefined,
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

// ── Types ─────────────────────────────────────────────────────────────────────

type UnifiedResultsProps = {
  query?: string;
  scope: "all" | "people" | "businesses" | "organizations" | "events";
  people: EnrichedDirectoryPerson[];
  businesses: BusinessProfile[];
  organizations: OrganizationDirectoryEntry[];
  events: EventDirectoryEntry[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function UnifiedResults({
  query,
  scope,
  people,
  businesses,
  organizations,
  events,
}: UnifiedResultsProps) {

  const totalResults = people.length + businesses.length + organizations.length + events.length;

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
        <RowList items={people.map(personRow)} />
      </div>
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {people.map((p) => <PersonCard key={p.id} person={p} />)}
      </div>
    </>
  );

  if (scope === "businesses") return (
    <>
      <div className="md:hidden">
        <RowList items={businesses.map(bizRow)} />
      </div>
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {businesses.map((b) => <BusinessCard key={b.id} business={b} />)}
      </div>
    </>
  );

  if (scope === "organizations") return (
    <>
      <div className="md:hidden">
        <RowList items={organizations.map(orgRow)} />
      </div>
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {organizations.map((o) => <OrganizationCard key={o.id} organization={o} />)}
      </div>
    </>
  );

  if (scope === "events") return (
    <>
      <div className="md:hidden">
        <RowList items={events.map(eventRow)} />
      </div>
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {events.map((e) => <EventCard key={e.id} event={e} />)}
      </div>
    </>
  );

  // ── scope === "all" ───────────────────────────────────────────────────────

  const topPeople = people.slice(0, 2);
  const topBiz    = businesses.slice(0, 2);
  const topOrgs   = organizations.slice(0, 2);
  const topEvents = (query && query.length > 2) ? events.slice(0, 2) : [];

  const hasTopMatches =
    topPeople.length > 0 || topBiz.length > 0 || topOrgs.length > 0 || topEvents.length > 0;

  const topMatchLabel = query ? "Top Matches" : "Suggested for You";

  const restPeople = people.slice(topPeople.length);
  const restBiz    = businesses.slice(topBiz.length);
  const restOrgs   = organizations.slice(topOrgs.length);
  const restEvents = events.slice(topEvents.length);

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {topPeople.map((p) => <PersonCard key={p.id} person={p} />)}
            {topBiz.map((b)    => <BusinessCard key={b.id} business={b} />)}
            {topOrgs.map((o)   => <OrganizationCard key={o.id} organization={o} />)}
            {topEvents.map((e) => <EventCard key={e.id} event={e} />)}
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
            <RowList items={restPeople.map(personRow)} />
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
            <RowList items={restBiz.map(bizRow)} />
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
            <RowList items={restOrgs.map(orgRow)} />
          </div>
          <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restOrgs.map((o) => <OrganizationCard key={o.id} organization={o} />)}
          </div>
        </section>
      )}

      {/* ── Events ───────────────────────────────────────────────────── */}
      {restEvents.length > 0 && (
        <section>
          <SectionLabel
            label={hasTopMatches ? "More Events" : "Events"}
            action={{ label: "View all", href: "/events" }}
            className="mb-4"
          />
          <div className="md:hidden">
            <RowList items={restEvents.map(eventRow)} />
          </div>
          <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restEvents.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

    </div>
  );
}
