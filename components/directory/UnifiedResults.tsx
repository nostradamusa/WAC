import type { EnrichedDirectoryPerson } from "@/lib/services/searchService";
import type { BusinessProfile } from "@/lib/types/business-directory";
import type { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import type { EventDirectoryEntry } from "@/lib/types/event-directory";
import PersonCard from "@/components/people/results/PersonCard";
import BusinessCard from "@/components/businesses/results/BusinessCard";
import OrganizationCard from "@/components/organizations/results/OrganizationCard";
import EventCard from "@/components/events/results/EventCard";
import DirectoryRow, { type DirectoryRowProps } from "@/components/directory/DirectoryRow";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function mkInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

function abbrevCountry(c: string | null | undefined) {
  if (!c) return "";
  const n = c.trim().toLowerCase();
  if (n === "united states" || n === "united states of america" || n === "usa") return "USA";
  if (n === "united kingdom" || n === "uk") return "UK";
  return c;
}

function loc(...parts: (string | null | undefined)[]) {
  return parts.map((p) => p?.trim()).filter(Boolean).join(", ");
}

// ── Entity → DirectoryRow adapters ───────────────────────────────────────────

function personRow(p: EnrichedDirectoryPerson): DirectoryRowProps {
  const name = p.full_name || p.username || "Member";
  return {
    href: p.username ? `/people/${p.username}` : "#",
    name,
    avatarUrl: p.avatar_url,
    initials: mkInitials(name),
    entityKind: "person",
    line2: p.headline?.trim() || p.profession_name?.trim() || p.specialty_name?.trim() || undefined,
    line3: loc(p.city, p.state, abbrevCountry(p.country)) || undefined,
    isVerified: p.is_verified,
    verifiedType: "person",
  };
}

function bizRow(b: BusinessProfile): DirectoryRowProps {
  return {
    href: `/businesses/${b.slug}`,
    name: b.name,
    avatarUrl: b.logo_url,
    initials: mkInitials(b.name),
    entityKind: "business",
    line2: b.industry_name?.trim() || b.business_type?.trim() || undefined,
    line3: loc(b.city, b.state, abbrevCountry(b.country)) || undefined,
    isVerified: b.is_verified,
    verifiedType: "business",
  };
}

function orgRow(o: OrganizationDirectoryEntry): DirectoryRowProps {
  return {
    href: `/organizations/${o.slug}`,
    name: o.name,
    avatarUrl: o.logo_url,
    initials: mkInitials(o.name),
    entityKind: "organization",
    line2: o.organization_type?.trim() || undefined,
    line3: loc(o.city, o.state, abbrevCountry(o.country)) || undefined,
    isVerified: o.is_verified,
    verifiedType: "organization",
  };
}

function eventRow(e: EventDirectoryEntry): DirectoryRowProps {
  return {
    href: `/events/${e.slug}`,
    name: e.name,
    avatarUrl: e.cover_image_url,
    initials: "",
    entityKind: "event",
    line2: e.date,
    line3: loc(e.city, e.state, abbrevCountry(e.country)) || e.location || undefined,
  };
}

// ── Mobile section header ─────────────────────────────────────────────────────

function MobileSectionHeader({
  label,
  viewAllHref,
}: {
  label: string;
  viewAllHref?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">{label}</p>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="flex items-center gap-0.5 text-[10px] text-white/25 hover:text-white/50 transition-colors"
        >
          View all <ChevronRight size={10} />
        </Link>
      )}
    </div>
  );
}

// ── Mobile row list ───────────────────────────────────────────────────────────

function MobileRowList({ items }: { items: DirectoryRowProps[] }) {
  return (
    <div className="wac-card p-0 overflow-hidden px-3">
      {items.map((props) => (
        <DirectoryRow key={props.href} {...props} />
      ))}
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

type UnifiedResultsProps = {
  query?: string;
  scope: "all" | "people" | "businesses" | "groups" | "events";
  people: EnrichedDirectoryPerson[];
  businesses: BusinessProfile[];
  groups: OrganizationDirectoryEntry[];
  events: EventDirectoryEntry[];
  isLoading?: boolean;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function UnifiedResults({
  query,
  scope,
  people,
  businesses,
  groups,
  events,
  isLoading = false,
}: UnifiedResultsProps) {

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <div className="md:hidden space-y-5">
          {[1, 2, 3].map((s) => (
            <div key={s} className="space-y-1.5">
              <div className="h-2.5 w-14 rounded bg-white/10 animate-pulse" />
              <div className="wac-card p-3 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
                      <div className="h-2.5 w-32 rounded bg-white/[0.06] animate-pulse" />
                    </div>
                    <div className="h-6 w-14 rounded-full bg-white/[0.06] animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="wac-card h-[220px] animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  const totalResults = people.length + businesses.length + groups.length + events.length;

  if (totalResults === 0) {
    return (
      <div className="wac-card p-16 text-center border-dashed border-white/10 opacity-70">
        <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
        <p>Try adjusting your query, shortening terms, or removing filters.</p>
      </div>
    );
  }

  // ── Filtered scope views ──────────────────────────────────────────────────
  // Mobile: compact row list. Desktop: card grid.

  if (scope === "people") return (
    <>
      <div className="md:hidden">
        <MobileRowList items={people.map(personRow)} />
      </div>
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {people.map((p) => <PersonCard key={p.id} person={p} />)}
      </div>
    </>
  );

  if (scope === "businesses") return (
    <>
      <div className="md:hidden">
        <MobileRowList items={businesses.map(bizRow)} />
      </div>
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {businesses.map((b) => <BusinessCard key={b.id} business={b} />)}
      </div>
    </>
  );

  if (scope === "groups") return (
    <>
      <div className="md:hidden">
        <MobileRowList items={groups.map(orgRow)} />
      </div>
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.map((g) => <OrganizationCard key={g.id} organization={g} />)}
      </div>
    </>
  );

  if (scope === "events") return (
    <>
      <div className="md:hidden">
        <MobileRowList items={events.map(eventRow)} />
      </div>
      <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {events.map((e) => <EventCard key={e.id} event={e} />)}
      </div>
    </>
  );

  // ── scope === "all" ───────────────────────────────────────────────────────

  const topPeople = people.slice(0, 2);
  const topBiz    = businesses.slice(0, 2);
  const topGroups = groups.slice(0, 2);
  const topEvents = (query && query.length > 2) ? events.slice(0, 2) : [];

  const hasTopMatches =
    topPeople.length > 0 || topBiz.length > 0 || topGroups.length > 0 || topEvents.length > 0;
  const topMatchLabel = query ? "Top Matches" : "Suggested for You";

  const restPeople  = people.slice(topPeople.length);
  const restBiz     = businesses.slice(topBiz.length);
  const restGroups  = groups.slice(topGroups.length);
  const restEvents  = events.slice(topEvents.length);

  return (
    <div className="w-full">

      {/* ── Mobile layout ────────────────────────────────────────────── */}
      <div className="md:hidden space-y-5">

        {/* Featured: top matches as richer cards */}
        {hasTopMatches && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[var(--accent)] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.45)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                {topMatchLabel}
              </p>
            </div>
            <div className="grid gap-3">
              {topPeople.map((p) => <PersonCard key={p.id} person={p} />)}
              {topBiz.map((b) => <BusinessCard key={b.id} business={b} />)}
              {topGroups.map((g) => <OrganizationCard key={g.id} organization={g} />)}
              {topEvents.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          </section>
        )}

        {/* People row list */}
        {restPeople.length > 0 && (
          <section>
            <MobileSectionHeader label="People" viewAllHref="/directory?scope=people" />
            <MobileRowList items={restPeople.map(personRow)} />
          </section>
        )}

        {/* Businesses row list */}
        {restBiz.length > 0 && (
          <section>
            <MobileSectionHeader label="Businesses" viewAllHref="/directory?scope=businesses" />
            <MobileRowList items={restBiz.map(bizRow)} />
          </section>
        )}

        {/* Organizations row list */}
        {restGroups.length > 0 && (
          <section>
            <MobileSectionHeader label="Organizations" viewAllHref="/directory?scope=groups" />
            <MobileRowList items={restGroups.map(orgRow)} />
          </section>
        )}

        {/* Events row list */}
        {restEvents.length > 0 && (
          <section>
            <MobileSectionHeader label="Events" viewAllHref="/events" />
            <MobileRowList items={restEvents.map(eventRow)} />
          </section>
        )}
      </div>

      {/* ── Desktop layout (flat multi-col grids) ────────────────────── */}
      <div className="hidden md:block">
        {hasTopMatches && (
          <div className="mb-10">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-white pb-3 border-b border-white/10 flex items-center gap-3">
              <span className="w-2 h-6 bg-[var(--accent)] rounded-full inline-block shadow-[0_0_12px_rgba(212,175,55,0.6)]" />
              {topMatchLabel}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {topPeople.map((p) => <PersonCard key={p.id} person={p} />)}
              {topBiz.map((b) => <BusinessCard key={b.id} business={b} />)}
              {topGroups.map((g) => <OrganizationCard key={g.id} organization={g} />)}
              {topEvents.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}
        {restPeople.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 opacity-70 uppercase tracking-widest pl-2">
              {hasTopMatches ? "More People" : "People"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {restPeople.map((p) => <PersonCard key={p.id} person={p} />)}
            </div>
          </div>
        )}
        {restBiz.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 opacity-70 uppercase tracking-widest pl-2">
              {hasTopMatches ? "More Businesses" : "Businesses"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {restBiz.map((b) => <BusinessCard key={b.id} business={b} />)}
            </div>
          </div>
        )}
        {restGroups.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 opacity-70 uppercase tracking-widest pl-2">
              {hasTopMatches ? "More Groups" : "Groups"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {restGroups.map((g) => <OrganizationCard key={g.id} organization={g} />)}
            </div>
          </div>
        )}
        {restEvents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 opacity-70 uppercase tracking-widest pl-2">Events</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {restEvents.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
