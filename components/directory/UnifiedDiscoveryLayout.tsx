"use client";

import { ReactNode, useState, useEffect } from "react";
import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import DirectorySearchContext from "./DirectorySearchContext";

type UnifiedDiscoveryLayoutProps = {
  initialQuery: string;
  scope: "all" | "people" | "businesses" | "organizations";
  results: ReactNode;
  filtersConfig: ReactNode;
  defaultFiltersOpen?: boolean;
  totalResults: number;
  peopleCount: number;
  businessCount: number;
  organizationsCount: number;
};

export default function UnifiedDiscoveryLayout({
  initialQuery,
  scope,
  results,
  filtersConfig,
  defaultFiltersOpen = false,
  totalResults,
  peopleCount,
  businessCount,
  organizationsCount,
}: UnifiedDiscoveryLayoutProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(defaultFiltersOpen);
  const searchParams = useSearchParams();

  // Close drawer when search params change (filter applied / scope changed)
  useEffect(() => {
    setIsFiltersOpen(false);
  }, [searchParams]);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = isFiltersOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isFiltersOpen]);

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">

      {/*
        Standard content container — shared by header and results so both
        align to the same horizontal grid.
      */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-16">

        {/* ── Page header: eyebrow → H1 → count → filter row ─────────── */}
        <DirectorySearchContext
          query={initialQuery}
          scope={scope}
          onFilterToggle={() => setIsFiltersOpen((v) => !v)}
          isFiltersOpen={isFiltersOpen}
          totalResults={totalResults}
          peopleCount={peopleCount}
          businessCount={businessCount}
          organizationsCount={organizationsCount}
        />

        {/* ── Results ───────────────────────────────────────────────── */}
        <main className="mt-8">
          {results}
        </main>

      </div>

      {/* ── Filter drawer ─────────────────────────────────────────────── */}
      {isFiltersOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
            onClick={() => setIsFiltersOpen(false)}
          />

          {/* Slide-out panel */}
          <aside className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-[#111] border-l border-white/[0.06] shadow-2xl z-[110] flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] bg-[#161616]">
              <div className="flex items-center gap-2.5">
                <span className="inline-block w-[2px] h-[14px] rounded-full bg-[#b08d57] opacity-70" />
                <span className="text-xs font-semibold tracking-[0.14em] uppercase text-white/60">
                  Refine Results
                </span>
              </div>
              <button
                onClick={() => setIsFiltersOpen(false)}
                className="p-2 rounded-full hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {filtersConfig}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
