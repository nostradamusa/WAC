"use client";

import { Search, PenLine, X } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

type DirectorySearchContextProps = {
  query: string;
  scope: "all" | "people" | "businesses" | "groups" | "events";
  onFilterToggle: () => void;
  isFiltersOpen: boolean;
  totalResults: number;
  peopleCount: number;
  businessCount: number;
  groupsCount: number;
  eventsCount: number;
};

export default function DirectorySearchContext({
  query,
  scope,
  onFilterToggle,
  isFiltersOpen,
  totalResults,
  peopleCount,
  businessCount,
  groupsCount,
  eventsCount,
}: DirectorySearchContextProps) {
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const handleEditSearch = () => {
    window.dispatchEvent(new CustomEvent("open-global-search"));
  };

  const getActiveFilters = () => {
    const filters = [];
    const country = searchParams.get("country");
    const industry = searchParams.get("industry");
    const specialty = searchParams.get("specialty");
    const mentor = searchParams.get("mentor");
    const work = searchParams.get("work");
    const hire = searchParams.get("hire");
    const invest = searchParams.get("invest");
    const collab = searchParams.get("collab");

    if (country) filters.push({ key: "country", label: country });
    if (industry) filters.push({ key: "industry", label: industry });
    if (specialty) filters.push({ key: "specialty", label: specialty });
    if (mentor === "true") filters.push({ key: "mentor", label: "Mentoring" });
    if (work === "true") filters.push({ key: "work", label: "Open to Work" });
    if (hire === "true") filters.push({ key: "hire", label: "Hiring" });
    if (invest === "true") filters.push({ key: "invest", label: "Investing" });
    if (collab === "true") filters.push({ key: "collab", label: "Collaborating" });
    return filters;
  };

  const activeFilters = getActiveFilters();

  const removeFilter = (keyToRemove: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(keyToRemove);
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("country");
    params.delete("industry");
    params.delete("specialty");
    params.delete("mentor");
    params.delete("work");
    params.delete("hire");
    params.delete("invest");
    params.delete("collab");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full relative z-10 py-6 sm:py-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-6 min-w-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 min-w-0">

        {/* Context Indicator */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-3 text-white/60 mb-2">
            <Search size={16} />
            <span className="text-sm font-medium tracking-wide uppercase">Directory</span>
          </div>
          {query ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                  &quot;{query}&quot;
                </h1>
                <button
                  onClick={handleEditSearch}
                  title="Edit search"
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white/40 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition shrink-0"
                >
                  <PenLine size={12} />
                </button>
                <a
                  href="/directory"
                  title="Clear search"
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white/40 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition shrink-0"
                >
                  <X size={12} />
                </a>
              </div>
            </div>
          ) : (
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              All Members
            </h1>
          )}

          <div className="mt-3 text-[13px] text-white/50 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-white/80">
              {totalResults}{" "}
              {scope === "people"
                ? totalResults === 1 ? "person" : "people"
                : scope === "businesses"
                ? totalResults === 1 ? "business" : "businesses"
                : scope === "groups"
                ? totalResults === 1 ? "group" : "groups"
                : scope === "events"
                ? totalResults === 1 ? "event" : "events"
                : totalResults === 1 ? "result" : "results"}
            </span>
            {query && <span>for &quot;{query}&quot;</span>}
            <span className="opacity-40 px-0.5 hidden sm:inline-block">•</span>
            <span className="inline-block flex-wrap w-full sm:w-auto">
              {peopleCount > 0 && `${peopleCount} ${peopleCount === 1 ? 'person' : 'people'} `}
              {peopleCount > 0 && (businessCount > 0 || groupsCount > 0 || eventsCount > 0) && "• "}
              {businessCount > 0 && `${businessCount} ${businessCount === 1 ? 'business' : 'businesses'} `}
              {businessCount > 0 && (groupsCount > 0 || eventsCount > 0) && "• "}
              {groupsCount > 0 && `${groupsCount} ${groupsCount === 1 ? 'group' : 'groups'} `}
              {groupsCount > 0 && eventsCount > 0 && "• "}
              {eventsCount > 0 && `${eventsCount} ${eventsCount === 1 ? 'event' : 'events'}`}
            </span>
          </div>
        </div>

        {/* Actions Selector — scrolls horizontally on mobile, never expands the page */}
        <div
          className="overflow-x-auto shrink-0 w-full md:w-auto"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex items-center gap-3 w-max md:w-auto">
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 shrink-0">
              {["all", "people", "businesses", "groups", "events"].map((s) => (
                <a
                  key={s}
                  href={`/directory?scope=${s}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition whitespace-nowrap ${
                    scope === s
                      ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                      : "text-white/60 border border-transparent hover:text-white"
                  }`}
                >
                  {s}
                </a>
              ))}
            </div>

            <button
              onClick={onFilterToggle}
              className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold uppercase transition border whitespace-nowrap ${isFiltersOpen ? "bg-white/10 text-white border-white/20" : "bg-transparent text-white/60 border-white/10 hover:bg-white/5"}`}
            >
              Filters
            </button>
          </div>
        </div>

        </div>
        
        {/* Active Filters Chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest mr-1">Filtered by:</span>
            {activeFilters.map(filter => (
              <div 
                key={filter.key}
                className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-xs text-white/80"
              >
                <span className="font-medium">{filter.label}</span>
                <button 
                  onClick={() => removeFilter(filter.key)}
                  className="p-1 rounded-full hover:bg-white/10 hover:text-red-400 transition"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button 
              onClick={clearAllFilters}
              className="text-xs text-white/50 hover:text-white transition ml-2 font-medium"
            >
              Clear all
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
