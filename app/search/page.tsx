import { Suspense } from "react";
import GlobalSearchBar from "@/components/search/GlobalSearchBar";
import PeopleResults from "@/components/people/results/PeopleResults";
import PeopleSkeleton from "@/components/people/results/PeopleSkeleton";
import { getPeopleDirectory } from "@/lib/services/searchService";
import type { EnrichedDirectoryPerson } from "@/lib/services/searchService";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const qParam = resolvedParams?.q;
  const q = typeof qParam === 'string' ? qParam.trim() : "";

  // The underlying view logic is now unified in the searchService
  // This eliminates the redundant fetching of 1000s of rows
  const { data: matchingPeople, error } = await getPeopleDirectory({ q });

  return (
    <main className="wac-page pb-20">
      <section className="mx-auto mt-12 mb-12 flex max-w-3xl flex-col items-center px-4 text-center">
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Global Search
        </h1>
        <p className="mb-8 max-w-xl text-lg opacity-80">
          Discover Albanians globally. Phase 1 lets you search the People directory by profession, name, skills, location, or ancestry.
        </p>

        <div className="w-full max-w-2xl">
          <Suspense fallback={<div className="h-12 w-full animate-pulse rounded-full bg-[rgba(255,255,255,0.05)]" />}>
            <GlobalSearchBar initialQuery={q} autoFocus={!q} />
          </Suspense>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white">
            People
          </span>
          <span className="cursor-not-allowed rounded-full border border-[var(--border)] px-4 py-1.5 text-xs opacity-40">
            Businesses (Soon)
          </span>
          <span className="cursor-not-allowed rounded-full border border-[var(--border)] px-4 py-1.5 text-xs opacity-40">
            Organizations (Soon)
          </span>
        </div>
      </section>

      {error && (
        <div className="mx-auto mb-10 max-w-5xl px-4">
          <div className="wac-card border-red-900/50 bg-red-900/10 p-6 text-center">
            <p className="text-red-400">Failed to load search index: {error.message}</p>
          </div>
        </div>
      )}

      {!error && (
        <div className="mx-auto w-full max-w-[90rem] px-4">
          <div className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
             <h2 className="text-xl font-bold">
               {q ? `Results for "${q}"` : "All Discoverable People"}
             </h2>
             <span className="text-sm opacity-60">
               {matchingPeople.length} {matchingPeople.length === 1 ? "result" : "results"}
             </span>
          </div>

          <Suspense fallback={<PeopleSkeleton />}>
            <PeopleResults people={matchingPeople as EnrichedDirectoryPerson[]} />
          </Suspense>
        </div>
      )}
    </main>
  );
}
