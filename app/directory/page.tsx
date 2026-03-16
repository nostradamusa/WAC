import { Suspense } from "react";
import PeopleDirectoryLayout from "@/components/people/layout/PeopleDirectoryLayout";
import PeopleResults from "@/components/people/results/PeopleResults";
import PeopleSkeleton from "@/components/people/results/PeopleSkeleton";
import PeopleSearchBar from "@/components/people/search/PeopleSearchBar";
import DirectoryTabs from "@/components/directory/DirectoryTabs";
import GlobalDirectoryFilters from "@/components/directory/GlobalDirectoryFilters";
import EntitiesTab from "@/components/directory/EntitiesTab";
import {
  getPeopleDirectory,
  getEntitiesCount,
  type UserProfileForRelevance,
} from "@/lib/services/searchService";
import { supabase } from "@/lib/supabase";
import type {
  EnrichedDirectoryPerson,
  SearchFilters,
} from "@/lib/services/searchService";

export type PeoplePageFilters = SearchFilters & {
  tab?: string;
  filter?: string; // Entities type
  location?: string; // Entities location
};

function buildActiveFilterPills(filters: PeoplePageFilters) {
  const pills: Array<{ label: string; value: string }> = [];

  if (filters.q) pills.push({ label: "Search", value: filters.q });

  // People Filters
  if (filters.country) pills.push({ label: "Country", value: filters.country });
  if (filters.industry)
    pills.push({ label: "Industry", value: filters.industry });
  if (filters.specialty)
    pills.push({ label: "Specialty", value: filters.specialty });
  if (filters.mentorOnly)
    pills.push({ label: "Mentor", value: "Open to mentoring" });
  if (filters.openToWork)
    pills.push({ label: "Status", value: "Open to Work" });
  if (filters.openToHire) pills.push({ label: "Status", value: "Hiring" });
  if (filters.openToInvest) pills.push({ label: "Status", value: "Investing" });
  if (filters.openToCollaborate) pills.push({ label: "Status", value: "Collaborating" });

  // Entity Filters
  if (filters.filter && filters.filter !== "all") {
    pills.push({
      label: "Type",
      value: filters.filter === "businesses" ? "Businesses" : "Organizations",
    });
  }
  if (filters.location) {
    pills.push({ label: "Location", value: filters.location });
  }

  return pills;
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tab?: string;
    country?: string;
    industry?: string;
    specialty?: string;
    mentor?: string;
    work?: string;
    hire?: string;
    invest?: string;
    collab?: string;
    filter?: string;
    location?: string;
  }>;
}) {
  const params = await searchParams;
  const activeTab = (params.tab as "people" | "entities") || "people";

  const filters: PeoplePageFilters = {
    q: params.q?.trim() ?? "",
    tab: activeTab,
    country: params.country?.trim() ?? "",
    industry: params.industry?.trim() ?? "",
    specialty: params.specialty?.trim() ?? "",
    mentorOnly: params.mentor === "true",
    openToWork: params.work === "true",
    openToHire: params.hire === "true",
    openToInvest: params.invest === "true",
    openToCollaborate: params.collab === "true",
    filter: params.filter?.trim() ?? "",
    location: params.location?.trim() ?? "",
  };

  const { data: { user } } = await supabase.auth.getUser();

  const { data: people, error } = await getPeopleDirectory(filters, user?.id);
  const entitiesCount = filters.q
    ? await getEntitiesCount(filters.q)
    : undefined;

  if (error) {
    return (
      <main className="wac-page">
        <div className="wac-card p-8">
          <h1 className="text-3xl font-bold">People Directory</h1>
          <p className="mt-4 text-red-400">
            Failed to load directory: {error.message}
          </p>
        </div>
      </main>
    );
  }

  const activeFilterPills = buildActiveFilterPills(filters);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <DirectoryTabs
        peopleCount={filters.q ? people.length : undefined}
        entitiesCount={entitiesCount}
      />
      <main className="w-full max-w-[90rem] mx-auto px-4 pb-20">
        <PeopleSearchBar initialQuery={filters.q} activeTab={activeTab} />

        {activeFilterPills.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {activeFilterPills.map((pill) => (
              <div
                key={`${pill.label}-${pill.value}`}
                className="rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-xs"
              >
                <span className="opacity-70">{pill.label}:</span> {pill.value}
              </div>
            ))}
          </div>
        )}

        {activeTab === "people" ? (
          <PeopleDirectoryLayout
            filters={
              <GlobalDirectoryFilters
                activeTab="people"
                totalResults={people.length}
              />
            }
            results={
              <Suspense fallback={<PeopleSkeleton />}>
                <PeopleResults people={people as EnrichedDirectoryPerson[]} />
              </Suspense>
            }
          />
        ) : (
          <PeopleDirectoryLayout
            filters={
              <GlobalDirectoryFilters
                activeTab="entities"
                // Entity count is handled client-side in MVP, we just pass 0 for SSR initial render
                totalResults={0}
              />
            }
            results={
              <Suspense fallback={<PeopleSkeleton />}>
                <EntitiesTab />
              </Suspense>
            }
          />
        )}
      </main>
    </div>
  );
}
