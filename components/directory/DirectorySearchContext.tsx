"use client";

import { X, SlidersHorizontal, LayoutGrid, Map, Users, Briefcase, Landmark, Home } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PROPERTIES_ENABLED } from "@/lib/constants/featureFlags";

// ── Scope config ──────────────────────────────────────────────────────────────

const SCOPES = [
  { value: "all",           label: "All" },
  { value: "people",        label: "People" },
  { value: "businesses",    label: "Businesses" },
  { value: "organizations", label: "Organizations" },
  { value: "properties",    label: "Properties", isSoon: !PROPERTIES_ENABLED },
];

type Scope = "all" | "people" | "businesses" | "organizations" | "properties";

// ── Types ─────────────────────────────────────────────────────────────────────

type DirectorySearchContextProps = {
  query: string;
  scope: Scope;
  view: "browse" | "map";
  onFilterToggle: () => void;
  isFiltersOpen: boolean;
  activeFilterCount: number;
  totalResults: number;
  peopleCount: number;
  businessCount: number;
  organizationsCount: number;
  propertiesCount: number;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DirectorySearchContext({
  query,
  scope,
  view,
  onFilterToggle,
  isFiltersOpen,
  activeFilterCount,
  totalResults,
  peopleCount,
  businessCount,
  organizationsCount,
  propertiesCount,
}: DirectorySearchContextProps) {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();

  // ── URL builders ──────────────────────────────────────────────────────────

  const buildScopeHref = (s: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (s === "all") params.delete("scope"); else params.set("scope", s);
    const qs = params.toString();
    return qs ? `/directory?${qs}` : "/directory";
  };

  const buildViewHref = (v: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "browse") params.delete("view"); else params.set("view", v);
    return params.toString() ? `${pathname}?${params.toString()}` : pathname;
  };

  // ── Active filter helpers ─────────────────────────────────────────────────

  const getActiveFilters = () => {
    const filters: { key: string; label: string }[] = [];
    const country  = searchParams.get("country");
    const industry = searchParams.get("industry");
    const profession = searchParams.get("profession");
    if (country)  filters.push({ key: "country",  label: country });
    if (industry) filters.push({ key: "industry", label: industry });
    if (profession) filters.push({ key: "profession", label: profession });

    const skillsArr = searchParams.getAll("skills");
    if (skillsArr.length > 0) {
      filters.push({ key: "skills", label: skillsArr.length === 1 ? skillsArr[0] : `${skillsArr.length} skills` });
    }

    if (searchParams.get("mentor")   === "true") filters.push({ key: "mentor",   label: "Mentoring" });
    if (searchParams.get("work")     === "true") filters.push({ key: "work",     label: "Open to Work" });
    if (searchParams.get("hire")     === "true") filters.push({ key: "hire",     label: "Hiring" });
    if (searchParams.get("collab")   === "true") filters.push({ key: "collab",   label: "Collaborating" });
    if (searchParams.get("active")   === "true") filters.push({ key: "active",   label: "Most Active" });
    if (searchParams.get("recent")   === "true") filters.push({ key: "recent",   label: "Recently Active" });
    const sort = searchParams.get("sort");
    if (sort && sort !== "relevant") filters.push({ key: "sort", label: `Sort: ${sort}` });

    const listingType = searchParams.get("listing_type");
    if (listingType) {
      const labelMap: Record<string, string> = {
        sale: "For Sale",
        long_term: "Long-Term Rental",
        short_term: "Short-Term / Vacation",
        commercial: "Commercial Lease",
      };
      filters.push({ key: "listing_type", label: labelMap[listingType] || listingType });
    }

    const propertyType = searchParams.get("property_type");
    if (propertyType) filters.push({ key: "property_type", label: propertyType.replace('_', ' ') });

    const bedrooms = searchParams.get("bedrooms");
    if (bedrooms) filters.push({ key: "bedrooms", label: `${bedrooms}+ Beds` });

    return filters;
  };

  const activeFilters = getActiveFilters();

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const qs = params.toString();
    router.push(qs ? `/directory?${qs}` : "/directory");
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    ["country","industry","profession","specialty","skills","mentor","work","hire","invest","collab","verified","active","recent","sort","property_type","bedrooms","listing_type"]
      .forEach(k => params.delete(k));
    const qs = params.toString();
    router.push(qs ? `/directory?${qs}` : "/directory");
  };

  // ── Scope chip counts ─────────────────────────────────────────────────────

  const scopeCount = (v: string) =>
    v === "people" ? peopleCount :
    v === "businesses" ? businessCount :
    v === "organizations" ? organizationsCount :
    v === "properties" ? propertiesCount :
    totalResults;

  // ── Result summary breakdown ──────────────────────────────────────────────

  const breakdownParts: { icon: React.ReactNode; label: string; count: number }[] = [];
  if (scope === "all") {
    if (peopleCount > 0)        breakdownParts.push({ icon: <Users size={10} strokeWidth={2} />,    label: "people",        count: peopleCount });
    if (businessCount > 0)      breakdownParts.push({ icon: <Briefcase size={10} strokeWidth={2} />, label: "businesses",    count: businessCount });
    if (organizationsCount > 0) breakdownParts.push({ icon: <Landmark size={10} strokeWidth={2} />,  label: "organizations", count: organizationsCount });
    if (propertiesCount > 0)    breakdownParts.push({ icon: <Home size={10} strokeWidth={2} />,      label: "properties",   count: propertiesCount });
  }

  const isMapView = view === "map";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Page Header: Title & Results ───────────────────── */}
      <div className="space-y-1 sm:space-y-1.5">

        {/* Title */}
        <div className="min-w-0">
          {query ? (
            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/22">
                Directory
              </span>
              <span className="text-white/15 text-[10px]">/</span>
              <h1 className="font-serif text-2xl sm:text-[28px] font-normal text-white/88 leading-tight truncate max-w-[55vw]">
                &ldquo;{query}&rdquo;
              </h1>
            </div>
          ) : (
            <h1 className="font-serif text-2xl sm:text-[28px] tracking-tight leading-tight">
              <span className="italic font-light text-[#b08d57]">Directory</span>
            </h1>
          )}
        </div>

        {/* Result summary */}
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 min-w-0">
          {totalResults === 0 ? (
            <span className="text-[14px] font-semibold text-white/28">No results found</span>
          ) : (
            <>
              <span className="text-[22px] font-bold text-white/80 leading-none tabular-nums">
                {totalResults.toLocaleString()}
              </span>
              <span className="text-[13px] font-medium text-white/35 leading-none">
                {totalResults === 1 ? "result" : "results"}
              </span>
              {breakdownParts.length > 0 && (
                <span className="flex items-center gap-2 text-[11px] text-white/22 font-medium leading-none mt-0.5 w-full sm:w-auto">
                  {breakdownParts.map((p, i) => (
                    <span key={p.label} className="flex items-center gap-1">
                      {i > 0 && <span className="text-white/12">·</span>}
                      <span className="flex items-center gap-0.5 text-white/30">
                        {p.icon}
                        <span>{p.count.toLocaleString()} {p.label}</span>
                      </span>
                    </span>
                  ))}
                </span>
              )}
            </>
          )}
        </div>

      </div>

      {/* ── Toolbar: Scopes → Browse/Map (primary) → Refine (secondary) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 min-w-0">

        {/* Scope chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mx-0.5 px-0.5 min-w-0 w-full sm:w-auto">
          {SCOPES.map(({ value, label, isSoon }) => {
            const isActive = scope === value;
            const count = scopeCount(value);

            if (isSoon) {
              return (
                <div
                  key={value}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-[7px] rounded-full text-[12px] font-semibold bg-[#b08d57]/[0.04] border border-[#b08d57]/10 text-white/30 cursor-not-allowed opacity-80"
                >
                  <span className="opacity-70">{label}</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#b08d57]/70 bg-[#b08d57]/10 px-1.5 py-[3px] rounded-md ml-0.5 leading-none">
                    Soon
                  </span>
                </div>
              );
            }

            return (
              <a
                key={value}
                href={buildScopeHref(value)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-[7px] rounded-full text-[12px] font-semibold transition-colors ${
                  isActive
                    ? "bg-[#b08d57]/12 text-[#b08d57] border border-[#b08d57]/28"
                    : "bg-white/[0.04] text-white/40 border border-white/[0.07] hover:bg-white/[0.07] hover:text-white/70"
                }`}
              >
                {label}
                {value !== "all" && count > 0 && (
                  <span className={`text-[10px] tabular-nums font-medium leading-none ${
                    isActive ? "text-[#b08d57]/55" : "text-white/20"
                  }`}>
                    {count}
                  </span>
                )}
              </a>
            );
          })}
        </div>

        {/* ── Right controls: Browse/Map (primary) + Refine (secondary) ── */}
        <div className="flex items-center gap-2.5 shrink-0">

          {/* Browse / Map — PRIMARY segmented control */}
          <div className="flex items-center shrink-0 p-[3px] rounded-xl bg-white/[0.05] border border-white/[0.09]">
            <a
              href={buildViewHref("browse")}
              className={`flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12px] font-semibold transition-all duration-150 ${
                !isMapView
                  ? "bg-white/[0.12] text-white/90 shadow-sm shadow-black/20"
                  : "text-white/30 hover:text-white/55"
              }`}
            >
              <LayoutGrid size={13} strokeWidth={!isMapView ? 2 : 1.5} />
              Browse
            </a>
            <a
              href={buildViewHref("map")}
              className={`flex items-center gap-1.5 px-3.5 py-[8px] rounded-[10px] text-[12px] font-semibold transition-all duration-150 ${
                isMapView
                  ? "bg-white/[0.12] text-white/90 shadow-sm shadow-black/20"
                  : "text-white/30 hover:text-white/55"
              }`}
            >
              <Map size={13} strokeWidth={isMapView ? 2 : 1.5} />
              Diaspora Map
            </a>
          </div>

          {/* Refine — SECONDARY compact trigger */}
          <button
            onClick={onFilterToggle}
            className={`shrink-0 flex items-center gap-1 px-2.5 h-[32px] rounded-lg border text-[11px] font-medium transition-all ${
              isFiltersOpen || activeFilterCount > 0
                ? "bg-[#b08d57]/[0.08] border-[#b08d57]/22 text-[#b08d57]/80"
                : "bg-transparent border-white/[0.06] text-white/28 hover:text-white/50 hover:border-white/[0.12]"
            }`}
          >
            <SlidersHorizontal size={12} strokeWidth={1.5} />
            <span className="hidden sm:inline">Refine</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[14px] h-[14px] rounded-full bg-[#b08d57]/90 text-black text-[8px] font-bold flex items-center justify-center px-[2px] leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

        </div>

      </div>

      {/* ── Row 4: Active filter pills ────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => removeFilter(filter.key)}
              className="flex items-center gap-1 pl-2.5 pr-1.5 py-[3px] rounded-full bg-[#b08d57]/[0.08] border border-[#b08d57]/18 text-[11px] font-medium text-[#b08d57]/72 hover:bg-[#b08d57]/[0.14] hover:text-[#b08d57] transition-colors group"
            >
              {filter.label}
              <X size={10} className="opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-[11px] font-medium text-white/18 hover:text-white/40 transition-colors ml-0.5"
          >
            Clear all
          </button>
        </div>
      )}

    </div>
  );
}
