"use client";

import { ReactNode, useState, useEffect } from "react";
import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import DirectorySearchContext from "./DirectorySearchContext";

type UnifiedDiscoveryLayoutProps = {
  initialQuery: string;
  scope: "all" | "people" | "businesses" | "groups" | "events";
  results: ReactNode;
  filtersConfig: ReactNode;
  defaultFiltersOpen?: boolean;
  totalResults: number;
  peopleCount: number;
  businessCount: number;
  groupsCount: number;
  eventsCount: number;
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
  groupsCount,
  eventsCount,
}: UnifiedDiscoveryLayoutProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(defaultFiltersOpen);
  const searchParams = useSearchParams();

  // Close filters natively if user navigates / applies a filter.
  useEffect(() => {
    setIsFiltersOpen(false);
  }, [searchParams]);

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isFiltersOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isFiltersOpen]);

  return (
    <div className="flex flex-col w-full bg-[var(--background)] min-h-screen">
      {/* QUICK CONTEXT INDICATOR (Replaces Hero) */}
      <section className="w-full border-b border-white/5 bg-[#111] pt-20 md:pt-24 relative z-20 shadow-xl">
        <DirectorySearchContext 
          query={initialQuery} 
          scope={scope} 
          onFilterToggle={() => setIsFiltersOpen(!isFiltersOpen)}
          isFiltersOpen={isFiltersOpen}
          totalResults={totalResults}
          peopleCount={peopleCount}
          businessCount={businessCount}
          groupsCount={groupsCount}
          eventsCount={eventsCount}
        />
      </section>

      {/* 2. DISCOVERY GRID AREA */}
      <section className="flex-1 w-full max-w-[90rem] mx-auto px-4 py-8 relative">
        <div className="flex flex-col gap-8 items-start">
          {/* Collapse/Expand Sidebar for Filters -> Now an Overlay Drawer */}
          {isFiltersOpen && (
            <>
              {/* Dark Backdrop */}
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" 
                onClick={() => setIsFiltersOpen(false)} 
              />
              
              {/* Slide-out Drawer */}
              <aside className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-[#111] border-l border-white/5 shadow-2xl z-[110] flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#1a1a1a]">
                  <h2 className="text-lg font-bold text-white tracking-widest uppercase">Refine Results</h2>
                  <button 
                    onClick={() => setIsFiltersOpen(false)}
                    className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {filtersConfig}
                </div>
              </aside>
            </>
          )}

          {/* RESULTS AREA */}
          <main className={`flex-1 min-w-0 transition-all duration-300`}>
            {results}
          </main>
        </div>
      </section>
    </div>
  );
}
