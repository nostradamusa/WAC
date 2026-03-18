import { Suspense } from "react";
import { getPeopleDirectory } from "@/lib/services/searchService";
import { supabase } from "@/lib/supabase";
import PeopleResults from "@/components/people/results/PeopleResults";
import PeopleFilters from "@/components/people/filters/PeopleFilters";
import PeopleSkeleton from "@/components/people/results/PeopleSkeleton";
import type { EnrichedDirectoryPerson } from "@/lib/services/searchService";

export const dynamic = "force-dynamic";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    country?: string;
    industry?: string;
    skills?: string;
    mentor?: string;
    work?: string;
    hire?: string;
  }>;
}) {
  const params = await searchParams;

  const skillsArr = params.skills
    ? params.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const filters = {
    q: params.q?.trim() ?? "",
    country: params.country?.trim() ?? "",
    industry: params.industry?.trim() ?? "",
    skills: skillsArr,
    mentorOnly: params.mentor === "true",
    openToWork: params.work === "true",
    openToHire: params.hire === "true",
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: people } = await getPeopleDirectory(filters, user?.id);

  return (
    <main className="min-h-screen bg-[var(--background)] pt-24 md:pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[var(--accent)] mb-3">
            People
          </h1>
          <p className="text-base opacity-70 max-w-xl">
            Discover Albanian professionals across every industry and corner of
            the world.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-72 shrink-0">
            <PeopleFilters
              country={filters.country}
              industry={filters.industry}
              skills={skillsArr}
              mentorOnly={filters.mentorOnly}
              openToWork={filters.openToWork}
              openToHire={filters.openToHire}
              totalResults={people.length}
            />
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Active filter pills */}
            {(filters.q ||
              filters.country ||
              filters.industry ||
              skillsArr.length > 0 ||
              filters.mentorOnly ||
              filters.openToWork ||
              filters.openToHire) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.q && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 px-3 py-1 text-xs font-medium text-[var(--accent)]">
                    &ldquo;{filters.q}&rdquo;
                  </span>
                )}
                {filters.country && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-white/70">
                    {filters.country}
                  </span>
                )}
                {filters.industry && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-white/70">
                    {filters.industry}
                  </span>
                )}
                {skillsArr.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400"
                  >
                    {skill}
                  </span>
                ))}
                {filters.mentorOnly && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-medium text-blue-400">
                    Mentoring
                  </span>
                )}
                {filters.openToWork && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                    Open to Work
                  </span>
                )}
                {filters.openToHire && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-medium text-purple-400">
                    Hiring
                  </span>
                )}
              </div>
            )}

            <Suspense fallback={<PeopleSkeleton />}>
              <PeopleResults people={people as EnrichedDirectoryPerson[]} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
