"use client";

import { Search, PenLine, X, SlidersHorizontal } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// ── Scope config ──────────────────────────────────────────────────────────────

const SCOPES = [
  { value: "all",           label: "All" },
  { value: "people",        label: "People" },
  { value: "businesses",    label: "Businesses" },
  { value: "organizations", label: "Organizations" },
] as const;

type Scope = "all" | "people" | "businesses" | "organizations";

// ── Result summary helper ─────────────────────────────────────────────────────

function buildResultSummary(
  scope: Scope,
  total: number,
  people: number,
  businesses: number,
  organizations: number,
): string {
  if (scope !== "all") {
    const labels: Record<Scope, [string, string]> = {
      all:           ["result",       "results"],
      people:        ["person",       "people"],
      businesses:    ["business",     "businesses"],
      organizations: ["organization", "organizations"],
    };
    const [singular, plural] = labels[scope];
    return `${total} ${total === 1 ? singular : plural}`;
  }

  const parts: string[] = [];
  if (people        > 0) parts.push(`${people} ${people === 1 ? "person" : "people"}`);
  if (businesses    > 0) parts.push(`${businesses} ${businesses === 1 ? "business" : "businesses"}`);
  if (organizations > 0) parts.push(`${organizations} ${organizations === 1 ? "organization" : "organizations"}`);

  if (parts.length === 0) return `${total} ${total === 1 ? "result" : "results"}`;
  return `${total} ${total === 1 ? "result" : "results"} · ${parts.join(" · ")}`;
}

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

  const resultSummary = buildResultSummary(
    scope, totalResults, peopleCount, businessCount, organizationsCount,
  );

  return (
    <div className="flex flex-col">

      {/* ── Zone 2: H1 ───────────────────────────────────────────────── */}
      {query ? (
        /* Search-results state: query in serif quotes + edit / clear */
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="font-serif text-2xl md:text-3xl font-normal text-white leading-tight">
            &ldquo;{query}&rdquo;
          </h1>
          <div className="flex items-center gap-1.5 translate-y-0.5">
            <button
              onClick={handleEditSearch}
              title="Edit search"
              className="flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.05] border border-white/10 text-white/40 hover:bg-[#b08d57]/10 hover:border-[#b08d57]/30 hover:text-[#b08d57] transition-colors"
            >
              <PenLine size={12} />
            </button>
            <a
              href="/directory"
              title="Clear search"
              className="flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.05] border border-white/10 text-white/40 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors"
            >
              <X size={12} />
            </a>
          </div>
        </div>
      ) : (
        /* Browse state: italic serif headline */
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight leading-tight">
          <span className="italic font-light opacity-90 text-[#b08d57]">Directory</span>
        </h1>
      )}

      {/* ── Zone 3: Result summary ────────────────────────────────────── */}
      <p className="mt-1.5 text-sm text-white/40">{resultSummary}</p>

      {/* ── Zone 4: Filter row ────────────────────────────────────────── */}
      {/*
        Scope tabs are filter chips (outlined pill style per standards).
        They live here on their own line — never beside the H1.
        FILTERS button is right-aligned with active-count badge.
      */}
      <div className="mt-4 flex items-center gap-2 min-w-0">

        {/* Scope chip row — horizontally scrollable on mobile */}
        <div className="relative flex-1 min-w-0">
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {SCOPES.map(({ value, label }) => {
              const isActive = scope === value;
              return (
                <a
                  key={value}
                  href={buildScopeHref(value)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-[#b08d57]/30 bg-[#b08d57]/[0.08] text-[#b08d57]/90"
                      : "border-white/[0.12] bg-transparent text-white/55 hover:text-white/80 hover:border-white/18"
                  }`}
                >
                  {label}
                </a>
              );
            })}
          </div>
          {/* Right-fade mask signals chip overflow on small screens */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--background)] to-transparent" />
        </div>

        {/* Filters button */}
        <button
          onClick={onFilterToggle}
          className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors ${
            isFiltersOpen || activeFilters.length > 0
              ? "border-[#b08d57]/30 bg-[#b08d57]/[0.08] text-[#b08d57]/80"
              : "border-white/[0.12] text-white/55 hover:text-white/80 hover:border-white/18"
          }`}
        >
          <SlidersHorizontal size={13} strokeWidth={2} />
          <span>Filters</span>
          {activeFilters.length > 0 && (
            <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[#b08d57] text-black text-[9px] font-bold leading-none">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Active filter chips ───────────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.12em]">
            Active:
          </span>
          {activeFilters.map((filter) => (
            <div
              key={filter.key}
              className="flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.09] text-xs text-white/65"
            >
              <span>{filter.label}</span>
              <button
                onClick={() => removeFilter(filter.key)}
                className="p-0.5 rounded-full hover:bg-white/10 hover:text-red-400 transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-[11px] text-white/30 hover:text-white/55 transition-colors ml-0.5"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
