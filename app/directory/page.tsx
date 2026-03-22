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

  const validScopes: string[] = ["all", "people", "businesses", "organizations"];
  const scope = validScopes.includes(scopeRaw)
    ? (scopeRaw as "all" | "people" | "businesses" | "organizations")
    : "all";

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

  const fetchPeople    = scope === "all" || scope === "people";
  const fetchEntities  = scope === "all" || scope === "organizations" || scope === "businesses";

  const [peopleRes, entitiesRes] = await Promise.all([
    fetchPeople
      ? getPeopleDirectory(filters, user?.id)
      : Promise.resolve({ data: [], error: null, count: 0 }),
    fetchEntities
      ? getEntitiesDirectory(filters)
      : Promise.resolve({ businesses: [], organizations: [], error: null }),
  ]);

  const people        = peopleRes.data;
  const businesses    = scope === "all" || scope === "businesses"    ? entitiesRes.businesses    : [];
  const organizations = scope === "all" || scope === "organizations" ? entitiesRes.organizations : [];

  const totalResults = people.length + businesses.length + organizations.length;

  return (
    <UnifiedDiscoveryLayout
      initialQuery={filters.q || ""}
      scope={scope}
      defaultFiltersOpen={false}
      filtersConfig={<GlobalDirectoryFilters totalResults={totalResults} scope={scope} />}
      totalResults={totalResults}
      peopleCount={people.length}
      businessCount={businesses.length}
      organizationsCount={organizations.length}
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
            organizations={organizations}
          />
        </Suspense>
      }
    />
  );
}
