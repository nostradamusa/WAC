import type { EnrichedDirectoryPerson } from "@/lib/services/searchService";
import type { BusinessProfile } from "@/lib/types/business-directory";
import type { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import type { EventDirectoryEntry } from "@/lib/types/event-directory";
import PersonCard from "@/components/people/results/PersonCard";
import BusinessCard from "@/components/businesses/results/BusinessCard";
import OrganizationCard from "@/components/organizations/results/OrganizationCard";
import EventCard from "@/components/events/results/EventCard";

type UnifiedResultsProps = {
  query?: string;
  scope: "all" | "people" | "businesses" | "groups" | "events";
  people: EnrichedDirectoryPerson[];
  businesses: BusinessProfile[];
  groups: OrganizationDirectoryEntry[];
  events: EventDirectoryEntry[];
  isLoading?: boolean;
};

export default function UnifiedResults({
  query,
  scope,
  people,
  businesses,
  groups,
  events,
  isLoading = false,
}: UnifiedResultsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="wac-card p-6 h-[250px] animate-pulse flex flex-col justify-between" />
        ))}
      </div>
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

  // Helper to render grids
  const renderPeopleGrid = (items: EnrichedDirectoryPerson[]) => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-10">
      {items.map((person) => (
        <div key={person.id} className="mx-auto w-full max-w-[28rem] md:max-w-none">
          <PersonCard person={person} />
        </div>
      ))}
    </div>
  );

  const renderBusinessGrid = (items: BusinessProfile[]) => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-10">
      {items.map((biz) => (
        <div key={biz.id} className="mx-auto w-full max-w-[28rem] md:max-w-none">
          <BusinessCard business={biz} />
        </div>
      ))}
    </div>
  );

  const renderGroupGrid = (items: OrganizationDirectoryEntry[]) => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-10">
      {items.map((group) => (
        <div key={group.id} className="mx-auto w-full max-w-[28rem] md:max-w-none">
          <OrganizationCard organization={group} />
        </div>
      ))}
    </div>
  );

  const renderEventGrid = (items: EventDirectoryEntry[]) => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-10">
      {items.map((event) => (
        <div key={event.id} className="mx-auto w-full max-w-[28rem] md:max-w-none">
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );

  // If filtered down explicitly, just render that section directly w/ no headers
  if (scope === "people") return renderPeopleGrid(people);
  if (scope === "businesses") return renderBusinessGrid(businesses);
  if (scope === "groups") return renderGroupGrid(groups);
  if (scope === "events") return renderEventGrid(events);

  // Otherwise scope is 'all'
  // Strategy: 
  // 1. "Top Matches" containing up to 2 of category matching exactly. Events only hit Top Matches if highly relevant (query length > 2)
  // 2. Ordered overflow: People -> Businesses -> Groups -> Events

  const topPeople = people.slice(0, 2);
  const topBiz = businesses.slice(0, 2);
  const topGroups = groups.slice(0, 2);
  const topEvents = (query && query.length > 2) ? events.slice(0, 2) : [];
  
  const hasTopMatches = topPeople.length > 0 || topBiz.length > 0 || topGroups.length > 0 || topEvents.length > 0;

  return (
    <div className="w-full flex justify-center w-full">
      <div className="w-full flex-col">
        {hasTopMatches && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-white pb-3 border-b border-white/10 flex items-center gap-3">
              <span className="w-2 h-6 bg-[var(--accent)] rounded-full inline-block shadow-[0_0_12px_rgba(212,175,55,0.6)]"></span> 
              Top Matches
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {topPeople.map((p) => <div key={p.id} className="w-full"><PersonCard person={p} /></div>)}
              {topBiz.map((b) => <div key={b.id} className="w-full"><BusinessCard business={b} /></div>)}
              {topGroups.map((g) => <div key={g.id} className="w-full"><OrganizationCard organization={g} /></div>)}
              {topEvents.map((e) => <div key={e.id} className="w-full"><EventCard event={e} /></div>)}
            </div>
           </div>
        )}

        {/* Remaining People */}
        {people.length > topPeople.length && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 opacity-70 uppercase tracking-widest pl-2">More People</h3>
            {renderPeopleGrid(people.slice(topPeople.length))}
          </div>
        )}

        {/* Remaining Businesses */}
        {businesses.length > topBiz.length && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 opacity-70 uppercase tracking-widest pl-2">More Businesses</h3>
            {renderBusinessGrid(businesses.slice(topBiz.length))}
          </div>
        )}

        {/* Remaining Groups */}
        {groups.length > topGroups.length && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 opacity-70 uppercase tracking-widest pl-2">More Groups</h3>
            {renderGroupGrid(groups.slice(topGroups.length))}
          </div>
        )}

        {/* Remaining Events */}
        {events.length > topEvents.length && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 opacity-70 uppercase tracking-widest pl-2">Events</h3>
            {renderEventGrid(events.slice(topEvents.length))}
          </div>
        )}
      </div>
    </div>
  );
}
