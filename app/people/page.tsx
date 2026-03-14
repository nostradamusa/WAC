import { Suspense } from "react";
import PeopleFilters from "@/components/people/filters/PeopleFilters";
import PeopleDirectoryLayout from "@/components/people/layout/PeopleDirectoryLayout";
import PeopleResults from "@/components/people/results/PeopleResults";
import PeopleSkeleton from "@/components/people/results/PeopleSkeleton";
import PeopleSearchBar from "@/components/people/search/PeopleSearchBar";
import DirectoryTabs from "@/components/directory/DirectoryTabs";
import { getPeopleDirectory } from "@/lib/services/searchService";
import type { EnrichedDirectoryPerson, SearchFilters } from "@/lib/services/searchService";

export type PeoplePageFilters = SearchFilters;

function buildActiveFilterPills(filters: PeoplePageFilters) {
  const pills: Array<{ label: string; value: string }> = [];

  if (filters.q) pills.push({ label: "Search", value: filters.q });
  if (filters.country) pills.push({ label: "Country", value: filters.country });
  if (filters.industry) pills.push({ label: "Industry", value: filters.industry });
  if (filters.specialty) pills.push({ label: "Specialty", value: filters.specialty });
  if (filters.mentorOnly) pills.push({ label: "Mentor", value: "Open to mentoring" });

  return pills;
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    country?: string;
    industry?: string;
    specialty?: string;
    mentor?: string;
  }>;
}) {
  const params = await searchParams;

  const filters: PeoplePageFilters = {
    q: params.q?.trim() ?? "",
    country: params.country?.trim() ?? "",
    industry: params.industry?.trim() ?? "",
    specialty: params.specialty?.trim() ?? "",
    mentorOnly: params.mentor === "true",
  };

  const { data: people, error } = await getPeopleDirectory(filters);

  if (error) {
    return (
      <main className="wac-page">
        <div className="wac-card p-8">
          <h1 className="text-3xl font-bold">People Directory</h1>
          <p className="mt-4 text-red-400">Failed to load directory: {error.message}</p>
        </div>
      </main>
    );
  }

  const activeFilterPills = buildActiveFilterPills(filters);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <DirectoryTabs />
      <main className="w-full max-w-[90rem] mx-auto px-4 pb-20">

      <PeopleSearchBar initialQuery={filters.q} />

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

      <PeopleDirectoryLayout
        filters={
          <PeopleFilters
            country={filters.country}
            industry={filters.industry}
            specialty={filters.specialty}
            mentorOnly={filters.mentorOnly}
            totalResults={people.length}
          />
        }
        results={
          <Suspense fallback={<PeopleSkeleton />}>
            <PeopleResults people={people as EnrichedDirectoryPerson[]} />
          </Suspense>
        }
      />
      </main>
    </div>
  );
}