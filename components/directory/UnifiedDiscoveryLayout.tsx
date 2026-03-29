"use client";

import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import DirectorySearchContext from "./DirectorySearchContext";
import GlobalDirectoryFilters from "./GlobalDirectoryFilters";
import DirectoryMapView from "./DirectoryMapView";
import type { EnrichedDirectoryPerson } from "@/lib/services/searchService";
import type { BusinessProfile } from "@/lib/types/business-directory";
import type { OrganizationDirectoryEntry } from "@/lib/types/organization-directory";
import type { EnrichedProperty } from "@/lib/types/property-directory";

// ── Types ─────────────────────────────────────────────────────────────────────

type UnifiedDiscoveryLayoutProps = {
  initialQuery: string;
  scope: "all" | "people" | "businesses" | "organizations" | "properties";
  view: "browse" | "map";
  results: ReactNode;
  defaultFiltersOpen?: boolean;
  totalResults: number;
  peopleCount: number;
  businessCount: number;
  organizationsCount: number;
  propertiesCount: number;
  people?: EnrichedDirectoryPerson[];
  businesses?: BusinessProfile[];
  organizations?: OrganizationDirectoryEntry[];
  properties?: EnrichedProperty[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function UnifiedDiscoveryLayout({
  initialQuery,
  scope,
  view,
  results,
  defaultFiltersOpen = false,
  totalResults,
  peopleCount,
  businessCount,
  organizationsCount,
  propertiesCount,
  people = [],
  businesses = [],
  organizations = [],
  properties = [],
}: UnifiedDiscoveryLayoutProps) {
  const [filtersOpen, setFiltersOpen] = useState(defaultFiltersOpen);
  const [mounted, setMounted]         = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();

  // SSR guard for createPortal
  useEffect(() => setMounted(true), []);

  // Close overlay when URL changes (filter applied / chip nav)
  useEffect(() => {
    setFiltersOpen(false);
  }, [searchParams]);

  // Esc to dismiss
  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  // Body scroll lock when overlay is open
  useEffect(() => {
    if (filtersOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [filtersOpen]);

  // Click outside to dismiss (desktop panel)
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setFiltersOpen(false);
    }
  }, []);

  // Count active filters for badge
  const activeFilterCount = [
    searchParams.get("country"),
    searchParams.get("industry"),
    searchParams.get("profession"),
    searchParams.getAll("skills").length > 0 ? "1" : null,
    searchParams.get("mentor")   === "true" ? "1" : null,
    searchParams.get("work")     === "true" ? "1" : null,
    searchParams.get("hire")     === "true" ? "1" : null,
    searchParams.get("collab")   === "true" ? "1" : null,
    searchParams.get("verified") === "true" ? "1" : null,
    searchParams.get("active")   === "true" ? "1" : null,
    searchParams.get("recent")   === "true" ? "1" : null,
    searchParams.get("sort") && searchParams.get("sort") !== "relevant" ? "1" : null,
    searchParams.get("listing_type"),
    searchParams.get("property_type"),
    searchParams.get("bedrooms"),
  ].filter(Boolean).length;

  function handleClearFilters() {
    const q = searchParams.get("q");
    const s = searchParams.get("scope");
    const v = searchParams.get("view");
    const p = new URLSearchParams();
    if (s) p.set("scope", s);
    if (q) p.set("q", q);
    if (v) p.set("view", v);
    const url = p.toString() ? `${pathname}?${p.toString()}` : pathname;
    router.push(url);
  }

  const isMapView = view === "map";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-16">

        {/* ── Top discovery controls ────────────────────────────────── */}
        <DirectorySearchContext
          query={initialQuery}
          scope={scope}
          view={view}
          onFilterToggle={() => setFiltersOpen(v => !v)}
          isFiltersOpen={filtersOpen}
          activeFilterCount={activeFilterCount}
          totalResults={totalResults}
          peopleCount={peopleCount}
          businessCount={businessCount}
          organizationsCount={organizationsCount}
          propertiesCount={propertiesCount}
        />

        {/* ── Map view (full width) ───────────────────────────────── */}
        {isMapView ? (
          <div className="mt-6">
            <DirectoryMapView
              scope={scope}
              totalResults={totalResults}
              people={people}
              businesses={businesses}
              organizations={organizations}
              properties={properties}
            />
          </div>
        ) : (
          /* ── Browse layout: results only (no sidebar — filters are overlay) ── */
          <div className="mt-6">
            <main className="min-w-0">
              {results}
            </main>
          </div>
        )}

      </div>

      {/* ── Refine Overlay ─────────────────────────────────────────────────── */}
      {/* Desktop: centered panel with backdrop                                */}
      {/* Mobile: full-screen sheet                                            */}
      {mounted && filtersOpen && createPortal(
        <div
          className="fixed inset-0 z-[9998] flex items-start justify-center"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* ── Desktop overlay panel ──────────────────────────────── */}
          <div
            ref={panelRef}
            className="
              relative z-10
              hidden lg:flex flex-col
              mt-[88px]
              w-full max-w-[560px]
              max-h-[calc(100dvh-120px)]
              rounded-2xl
              border border-white/[0.08]
              bg-[#0e0e10]/[0.97] backdrop-blur-xl
              shadow-2xl shadow-black/40
              animate-in fade-in slide-in-from-top-2 duration-200
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center gap-3 px-5 h-[52px] border-b border-white/[0.06]">
              <h2 className="text-[14px] font-semibold text-white/88 tracking-tight flex-1">
                Refine Results
              </h2>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#b08d57]/15 border border-[#b08d57]/25 text-[10px] font-bold text-[#b08d57] px-1.5">
                  {activeFilterCount}
                </span>
              )}
              <button
                onClick={() => setFiltersOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/72 transition-all -mr-1"
              >
                <X size={17} />
              </button>
            </div>

            {/* Scrollable filter content */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.05)_transparent]">
              <div className="px-5 pt-1 pb-4">
                <GlobalDirectoryFilters
                  scope={scope}
                  totalResults={totalResults}
                  filterId="directory-filter-desktop"
                />
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="shrink-0 border-t border-white/[0.06] px-5 py-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex-1 px-4 py-2.5 rounded-full border border-white/[0.09] text-[12px] font-medium text-white/38 hover:text-white/58 transition-all text-center"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  form="directory-filter-desktop"
                  className="flex-[2] px-4 py-2.5 rounded-full bg-[#b08d57]/[0.13] border border-[#b08d57]/22 text-[12px] font-semibold text-[#b08d57]/90 hover:bg-[#b08d57]/[0.22] transition-all text-center"
                >
                  {totalResults > 0
                    ? `Show ${totalResults.toLocaleString()} ${totalResults === 1 ? "Result" : "Results"}`
                    : activeFilterCount > 0 ? "No Results" : "Show Results"
                  }
                </button>
              </div>
            </div>
          </div>

          {/* ── Mobile full-screen sheet ───────────────────────────── */}
          <div
            className="
              relative z-10
              flex flex-col lg:hidden
              w-full h-full
              bg-[#09090b]
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 px-4 h-[52px]">
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/72 transition-all -ml-1"
                >
                  <X size={17} />
                </button>
                <h2 className="text-[14px] font-semibold text-white/88 tracking-tight flex-1">
                  Refine Results
                </h2>
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#b08d57]/15 border border-[#b08d57]/25 text-[10px] font-bold text-[#b08d57] px-1.5">
                    {activeFilterCount}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable filter content */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="px-4 pt-1 pb-4">
                <GlobalDirectoryFilters
                  scope={scope}
                  totalResults={totalResults}
                  filterId="directory-filter-mobile"
                />
              </div>
            </div>

            {/* Bottom action bar */}
            <div
              className="shrink-0 border-t border-white/[0.06] bg-[#09090b]/95 backdrop-blur-md px-4 pt-3 pb-4"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex-1 px-4 py-2.5 rounded-full border border-white/[0.09] text-[12px] font-medium text-white/38 hover:text-white/58 transition-all text-center"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  form="directory-filter-mobile"
                  className="flex-[2] px-4 py-2.5 rounded-full bg-[#b08d57]/[0.13] border border-[#b08d57]/22 text-[12px] font-semibold text-[#b08d57]/90 hover:bg-[#b08d57]/[0.22] transition-all text-center"
                >
                  {totalResults > 0
                    ? `Show ${totalResults.toLocaleString()} ${totalResults === 1 ? "Result" : "Results"}`
                    : activeFilterCount > 0 ? "No Results" : "Show Results"
                  }
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
