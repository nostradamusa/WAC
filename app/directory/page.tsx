import { Suspense } from "react";
import UnifiedDiscoveryLayout from "@/components/directory/UnifiedDiscoveryLayout";
import UnifiedResults from "@/components/directory/UnifiedResults";
import GlobalDirectoryFilters from "@/components/directory/GlobalDirectoryFilters";
import {
  getPeopleDirectory,
  getEntitiesDirectory,
} from "@/lib/services/searchService";
import { supabase } from "@/lib/supabase";
import type { SearchFilters, EnrichedDirectoryPerson } from "@/lib/services/searchService";
import type { EventDirectoryEntry } from "@/lib/types/event-directory";

export const dynamic = "force-dynamic";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    scope?: string;
    country?: string;
    industry?: string;
    specialty?: string;
    skills?: string;
    mentor?: string;
    work?: string;
    hire?: string;
    invest?: string;
    collab?: string;
  }>;
}) {
  const params = await searchParams;
  const scopeRaw = params.scope?.toLowerCase() || "all";
  const mappedScope = scopeRaw === "organizations" ? "groups" : scopeRaw;
  
  const validScopes: string[] = ["all", "people", "groups", "businesses", "events"];
  const scope = validScopes.includes(mappedScope) ? (mappedScope as "all" | "people" | "groups" | "businesses" | "events") : "all";

  const filters: SearchFilters = {
    q: params.q?.trim() ?? "",
    country: params.country?.trim() ?? "",
    industry: params.industry?.trim() ?? "",
    specialty: params.specialty?.trim() ?? "",
    skills: params.skills?.trim()
      ? params.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    mentorOnly: params.mentor === "true",
    openToWork: params.work === "true",
    openToHire: params.hire === "true",
    openToInvest: params.invest === "true",
    openToCollaborate: params.collab === "true",
  };

  const { data: { user } } = await supabase.auth.getUser();

  const fetchPeople = scope === "all" || scope === "people";
  const fetchEntities = scope === "all" || scope === "groups" || scope === "businesses";
  const fetchEvents = scope === "all" || scope === "events";

  const [peopleRes, entitiesRes] = await Promise.all([
    fetchPeople ? getPeopleDirectory(filters, user?.id) : Promise.resolve({ data: [], error: null, count: 0 }),
    fetchEntities ? getEntitiesDirectory(filters) : Promise.resolve({ businesses: [], organizations: [], error: null })
  ]);

  const people = peopleRes.data;
  const businesses = scope === "all" || scope === "businesses" ? entitiesRes.businesses : [];
  const groups = scope === "all" || scope === "groups" ? entitiesRes.organizations : [];
  
  const mockEvents: EventDirectoryEntry[] = [
    {
      id: "ev-1",
      name: "Global Albanian Tech Summit 2026",
      slug: "tech-summit-2026",
      date: "2026-10-15",
      time: "9:00 AM EST",
      location: "Javits Center",
      city: "New York",
      state: "NY",
      country: "USA",
      description: "Join thousands of Albanian professionals for the largest tech and innovation summit of the year. Featuring keynote speakers from top tier firms.",
      attendees_count: 1250,
    },
    {
      id: "ev-2",
      name: "Illyrian Founders Retreat",
      slug: "founders-retreat",
      date: "2026-11-05",
      time: "10:00 AM CET",
      location: "Marriot Hotel",
      city: "Tirana",
      country: "Albania",
      description: "An exclusive weekend retreat for Albanian founders and venture capitalists discussing the future of the Balkan tech ecosystem.",
      attendees_count: 45,
    }
  ];

  // TODO: Implement actual getEventsDirectory backend service once DB schema expands
  // Mock events are placeholder data — only show when browsing without a query
  const events: EventDirectoryEntry[] = fetchEvents && !filters.q ? mockEvents : [];

  const totalResults = people.length + businesses.length + groups.length + events.length;

  return (
    <UnifiedDiscoveryLayout
      initialQuery={filters.q || ""}
      scope={scope}
      defaultFiltersOpen={false}
      filtersConfig={<GlobalDirectoryFilters totalResults={totalResults} scope={scope} />}
      totalResults={totalResults}
      peopleCount={people.length}
      businessCount={businesses.length}
      groupsCount={groups.length}
      eventsCount={events.length}
      results={
        <Suspense fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="wac-card h-[220px] animate-pulse" />
            ))}
          </div>
        }>
          <UnifiedResults
            query={filters.q || undefined}
            scope={scope}
            people={people as EnrichedDirectoryPerson[]}
            businesses={businesses}
            groups={groups}
            events={events}
          />
        </Suspense>
      }
    />
  );
}
