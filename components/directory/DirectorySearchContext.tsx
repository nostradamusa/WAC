"use client";

import { Search, PenLine, X, SlidersHorizontal, Sparkles } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// ── Scope config ──────────────────────────────────────────────────────────────

const SCOPES = [
  { value: "all",           label: "All" },
  { value: "people",        label: "People" },
  { value: "businesses",    label: "Businesses" },
  { value: "organizations", label: "Organizations" },
] as const;

type Scope = "all" | "people" | "businesses" | "organizations";

// ── Types ─────────────────────────────────────────────────────────────────────

type DirectorySearchContextProps = {
  query: string;
  scope: Scope;
  onFilterToggle: () => void;
  isFiltersOpen: boolean;
  totalResults: number;
  peopleCount: number;
  businessCount: number;
  organizationsCount: number;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DirectorySearchContext({
  query,
  scope,
  onFilterToggle,
  isFiltersOpen,
  totalResults,
  peopleCount,
  businessCount,
  organizationsCount,
}: DirectorySearchContextProps) {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();

  const handleEditSearch = () => {
    window.dispatchEvent(new CustomEvent("open-global-search"));
  };

  // Preserve all current params when switching scope
  const buildScopeHref = (s: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (s === "all") {
      params.delete("scope");
    } else {
      params.set("scope", s);
    }
    const qs = params.toString();
    return qs ? `/directory?${qs}` : "/directory";
  };

  const getActiveFilters = () => {
    const filters: { key: string; label: string }[] = [];
    const country   = searchParams.get("country");
    const industry  = searchParams.get("industry");
    const specialty = searchParams.get("specialty");
    const mentor    = searchParams.get("mentor");
    const work      = searchParams.get("work");
    const hire      = searchParams.get("hire");
    const invest    = searchParams.get("invest");
    const collab    = searchParams.get("collab");

    if (country)             filters.push({ key: "country",   label: country });
    if (industry)            filters.push({ key: "industry",  label: industry });
    if (specialty)           filters.push({ key: "specialty", label: specialty });
    if (mentor  === "true")  filters.push({ key: "mentor",    label: "Mentoring" });
    if (work    === "true")  filters.push({ key: "work",      label: "Open to Work" });
    if (hire    === "true")  filters.push({ key: "hire",      label: "Hiring" });
    if (invest  === "true")  filters.push({ key: "invest",    label: "Investing" });
    if (collab  === "true")  filters.push({ key: "collab",    label: "Collaborating" });
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
    ["country", "industry", "specialty", "mentor", "work", "hire", "invest", "collab"].forEach(
      (k) => params.delete(k),
    );
    router.push(`${pathname}?${params.toString()}`);
  };

  // Build the secondary text line parts
  const subParts: string[] = [];
  if (peopleCount > 0) subParts.push(`${peopleCount} ${peopleCount === 1 ? "person" : "people"}`);
  if (businessCount > 0) subParts.push(`${businessCount} ${businessCount === 1 ? "business" : "businesses"}`);
  if (organizationsCount > 0) subParts.push(`${organizationsCount} ${organizationsCount === 1 ? "organization" : "organizations"}`);

  return (
    <div className="flex flex-col gap-5">

      {/* ── Hierarchy 1: Page Title ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        {query ? (
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-serif text-3xl md:text-4xl font-normal text-white leading-tight">
              &ldquo;{query}&rdquo;
            </h1>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleEditSearch}
                title="Edit search"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/40 hover:bg-[#b08d57]/10 hover:border-[#b08d57]/30 hover:text-[#b08d57] transition-colors"
              >
                <PenLine size={14} />
              </button>
              <a
                href="/directory"
                title="Clear search"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/40 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors"
              >
                <X size={14} />
              </a>
            </div>
          </div>
        ) : (
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight leading-tight">
            <span className="italic font-light opacity-90 text-[#b08d57]">Directory</span>
          </h1>
        )}
      </div>

      {/* ── Hierarchy 2: Result Summary ────────────────────────────────── */}
      <div className="flex flex-col gap-1 border-l-2 border-[#b08d57]/40 pl-4 py-1">
        <span className="text-sm font-bold text-white tracking-wide">
          {totalResults} {totalResults === 1 ? "Result found" : "Results found"}
        </span>
        {subParts.length > 0 && (
          <span className="text-[13px] font-medium text-white/40">
            {subParts.join(" • ")}
          </span>
        )}
      </div>

      {/* ── Hierarchy 3: Controls (Scopes + Filters) ───────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        
        {/* Filters Button — intentionally smaller/secondary */}
        <button
          onClick={onFilterToggle}
          className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
            isFiltersOpen || activeFilters.length > 0
              ? "bg-[#b08d57]/10 text-[#b08d57] border border-[#b08d57]/20"
              : "bg-white/5 text-white/50 border border-white/[0.08] hover:bg-white/10 hover:text-white/80"
          }`}
        >
          <SlidersHorizontal size={10} />
          Filters
          {activeFilters.length > 0 && (
            <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#b08d57] text-black text-[9px] font-bold">
              {activeFilters.length}
            </span>
          )}
        </button>

        {/* Vertical Divider */}
        <div className="w-px h-5 bg-white/10 shrink-0 mx-0.5" />

        {/* Scope Pills */}
        {SCOPES.map(({ value, label }) => {
          const isActive = scope === value;
          return (
            <a
              key={value}
              href={buildScopeHref(value)}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                isActive
                  ? "bg-[#b08d57]/10 text-[#b08d57] border border-[#b08d57]/30"
                  : "bg-white/5 text-white/60 border border-white/[0.08] hover:bg-white/10 hover:text-white/90"
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>

      {/* ── Active Filters ─────────────────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {activeFilters.map((filter) => (
            <div
              key={filter.key}
              className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-[#b08d57]/10 border border-[#b08d57]/20 text-xs font-semibold text-[#b08d57]"
            >
              {filter.label}
              <button
                onClick={() => removeFilter(filter.key)}
                className="p-1 rounded-full hover:bg-[rgba(0,0,0,0.2)] transition-colors"
                title={`Remove ${filter.label} filter`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-white/30 hover:text-white hover:underline transition-colors ml-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Hierarchy 4: Light Discovery Suggestion (Optional but requested) ── */}
      {!query && activeFilters.length === 0 && scope === "all" && (
        <div className="mt-2 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-900/10 to-transparent border border-emerald-500/10 rounded-2xl w-fit">
          <Sparkles size={14} className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400/80">
            Suggested: Discover active hubs and verified mentors around you.
          </span>
        </div>
      )}

    </div>
  );
}
