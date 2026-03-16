"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type DirectoryTabsProps = {
  peopleCount?: number;
  entitiesCount?: number;
};

function DirectoryTabsInner({
  peopleCount,
  entitiesCount,
}: DirectoryTabsProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "people";
  const isEntities = currentTab === "entities";

  // Preserve the search query when switching tabs
  const q = searchParams.get("q");
  const baseQuery = q ? `&q=${encodeURIComponent(q)}` : "";

  return (
    <div className="flex items-center justify-center gap-4">
      <Link
        href={`/directory?tab=people${baseQuery}`}
        className={`px-8 py-3 rounded-full font-medium tracking-wide transition-all flex items-center gap-2 ${!isEntities ? "bg-[var(--accent)]/10 border border-[var(--accent)]/50 text-[#D4AF37] shadow-[0_0_20px_rgba(176,141,87,0.1)]" : "bg-white/5 border border-[var(--border)] hover:border-white/20 text-white/70 hover:text-white"}`}
      >
        People{" "}
        {q && peopleCount !== undefined && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${!isEntities ? "bg-[var(--accent)]/20 text-[#D4AF37]" : "bg-white/10"}`}
          >
            {peopleCount}
          </span>
        )}
      </Link>
      <Link
        href={`/directory?tab=entities${baseQuery}`}
        className={`px-8 py-3 rounded-full font-medium tracking-wide transition-all flex items-center gap-2 ${isEntities ? "bg-[var(--accent)]/10 border border-[var(--accent)]/50 text-[#D4AF37] shadow-[0_0_20px_rgba(176,141,87,0.1)]" : "bg-white/5 border border-[var(--border)] hover:border-white/20 text-white/70 hover:text-white"}`}
      >
        Organizations{" "}
        {q && entitiesCount !== undefined && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs ${isEntities ? "bg-[var(--accent)]/20 text-[#D4AF37]" : "bg-white/10"}`}
          >
            {entitiesCount}
          </span>
        )}
      </Link>
    </div>
  );
}

export default function DirectoryTabs({
  peopleCount,
  entitiesCount,
}: DirectoryTabsProps) {
  return (
    <div className="pt-32 pb-8 bg-[var(--background)] border-b border-white/5 mb-8">
      <div className="mx-auto max-w-[90rem] px-4">
        <div className="mb-10 text-center">
          <span className="wac-eyebrow mb-2 inline-block">
            Global Discovery Engine
          </span>
          <h1 className="text-4xl sm:text-6xl font-serif tracking-tight leading-tight text-white">
            The{" "}
            <span className="text-[#D4AF37] italic font-light opacity-90">
              Directory
            </span>
          </h1>
        </div>

        {/* Tab Navigation */}
        <Suspense fallback={<div className="h-[48px]" />}>
          <DirectoryTabsInner peopleCount={peopleCount} entitiesCount={entitiesCount} />
        </Suspense>
      </div>
    </div>
  );
}
