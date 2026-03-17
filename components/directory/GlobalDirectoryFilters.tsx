"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FormEvent } from "react";
import { ChevronDown } from "lucide-react";

type GlobalDirectoryFiltersProps = {
  totalResults: number;
  scope: "all" | "people" | "businesses" | "groups" | "events";
};

export default function GlobalDirectoryFilters({
  totalResults,
  scope,
}: GlobalDirectoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleApplyFilters(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());

    const country = formData.get("country") as string;
    const industry = formData.get("industry") as string;
    const specialty = formData.get("specialty") as string;
    const mentorOnly = formData.get("mentor") === "true";
    const openToWork = formData.get("work") === "true";
    const openToHire = formData.get("hire") === "true";
    const invest = formData.get("invest") === "true";
    const collab = formData.get("collab") === "true";
    const scopeVal = formData.get("scope") as string;

    if (country) params.set("country", country); else params.delete("country");
    if (industry) params.set("industry", industry); else params.delete("industry");
    if (specialty) params.set("specialty", specialty); else params.delete("specialty");
    if (mentorOnly) params.set("mentor", "true"); else params.delete("mentor");
    if (openToWork) params.set("work", "true"); else params.delete("work");
    if (openToHire) params.set("hire", "true"); else params.delete("hire");
    if (invest) params.set("invest", "true"); else params.delete("invest");
    if (collab) params.set("collab", "true"); else params.delete("collab");
    
    if (scopeVal && scopeVal !== "all") params.set("scope", scopeVal);
    else params.delete("scope");

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleClearFilters() {
    const q = searchParams.get("q");
    const s = searchParams.get("scope");
    
    // Using native form reset is handled by the form inherently, but router push will rerender.
    const params = new URLSearchParams();
    if (s) params.set("scope", s);
    if (q) params.set("q", q);

    let url = pathname;
    if (params.toString()) url += `?${params.toString()}`;
    router.push(url);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleApplyFilters} className="space-y-0">
        
        {/* SECTION 1: INTENT */}
        {(scope === "all" || scope === "people") && (
          <div className="space-y-3 pb-6 border-b border-white/10">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Intent</h3>
            
            <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.01)] px-4 py-3 text-xs font-medium cursor-pointer hover:border-[var(--accent)]/50 transition">
              <input type="checkbox" name="mentor" value="true" defaultChecked={searchParams.get("mentor") === "true"} className="accent-[var(--accent)]" />
              Mentoring
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.01)] px-4 py-3 text-xs font-medium cursor-pointer hover:border-[var(--accent)]/50 transition">
              <input type="checkbox" name="hire" value="true" defaultChecked={searchParams.get("hire") === "true"} className="accent-[var(--accent)]" />
              Hiring
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.01)] px-4 py-3 text-xs font-medium cursor-pointer hover:border-[var(--accent)]/50 transition">
              <input type="checkbox" name="work" value="true" defaultChecked={searchParams.get("work") === "true"} className="accent-[var(--accent)]" />
              Open to Work
            </label>
            
            <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.01)] px-4 py-3 text-xs font-medium opacity-50 cursor-not-allowed">
              <input type="checkbox" disabled className="accent-[var(--accent)]" />
              Investing (Future)
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.01)] px-4 py-3 text-xs font-medium cursor-pointer hover:border-[var(--accent)]/50 transition">
              <input type="checkbox" name="collab" value="true" defaultChecked={searchParams.get("collab") === "true"} className="accent-[var(--accent)]" />
              Collaborating
            </label>
          </div>
        )}

        {/* SECTION 2: TYPE (SCOPE) */}
        <div className="space-y-3 py-6 border-b border-white/10">
          <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Type</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold cursor-pointer transition ${scope === "all" ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]" : "bg-white/5 border-transparent text-white/70 hover:text-white"}`}>
              <input type="radio" name="scope" value="all" defaultChecked={scope === "all" || !scope} className="sr-only" />
              All
            </label>
            <label className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold cursor-pointer transition ${scope === "people" ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]" : "bg-white/5 border-transparent text-white/70 hover:text-white"}`}>
              <input type="radio" name="scope" value="people" defaultChecked={scope === "people"} className="sr-only" />
              People
            </label>
            <label className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold cursor-pointer transition ${scope === "businesses" ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]" : "bg-white/5 border-transparent text-white/70 hover:text-white"}`}>
              <input type="radio" name="scope" value="businesses" defaultChecked={scope === "businesses"} className="sr-only" />
              Businesses
            </label>
            <label className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold cursor-pointer transition ${scope === "groups" ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]" : "bg-white/5 border-transparent text-white/70 hover:text-white"}`}>
              <input type="radio" name="scope" value="groups" defaultChecked={scope === "groups"} className="sr-only" />
              Groups
            </label>
            <label className={`flex items-center justify-center gap-2 rounded-xl col-span-2 border px-3 py-3 text-xs font-bold cursor-pointer transition ${scope === "events" ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]" : "bg-white/5 border-transparent text-white/70 hover:text-white"}`}>
              <input type="radio" name="scope" value="events" defaultChecked={scope === "events"} className="sr-only" />
              Events
            </label>
          </div>
        </div>

        {/* SECTION 3: LOCATION */}
        <div className="py-6 border-b border-white/10">
          <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Location</h3>
          <label htmlFor="country" className="mb-1.5 block text-xs font-medium opacity-60 uppercase tracking-widest">
            Country / Region
          </label>
          <input
            id="country"
            name="country"
            type="text"
            defaultValue={searchParams.get("country") || ""}
            className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white"
          />
        </div>

        {/* SECTION 4: INDUSTRY */}
        <div className="py-6 border-b border-white/10">
          <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-4">Industry</h3>
          <input
            id="industry"
            name="industry"
            type="text"
            defaultValue={searchParams.get("industry") || ""}
            placeholder="e.g. Healthcare, Tech"
            className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white"
          />
        </div>

        {/* SECTION 5: ADVANCED */}
        {(scope === "all" || scope === "people") && (
          <details className="py-6 group">
            <summary className="text-sm font-bold text-white tracking-widest uppercase cursor-pointer list-none flex items-center justify-between outline-none">
              Advanced <ChevronDown size={18} className="text-white/40 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pt-6 space-y-2">
              <label htmlFor="specialty" className="mb-1.5 block text-xs font-medium opacity-60 uppercase tracking-widest">
                Specialty
              </label>
              <input
                id="specialty"
                name="specialty"
                type="text"
                defaultValue={searchParams.get("specialty") || ""}
                placeholder="e.g. Cardiology, Frontend"
                className="w-full rounded-xl border border-[var(--border)] bg-[#111] px-5 py-3 text-sm outline-none transition focus:border-[var(--accent)] text-white"
              />
            </div>
          </details>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="w-full py-3 rounded-full font-bold bg-[var(--accent)] text-black hover:bg-[#F3E5AB] transition-colors shadow-lg shadow-[var(--accent)]/10 text-sm"
          >
            Apply Filters
          </button>
        </div>
      </form>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[#111] px-5 py-4 text-xs flex flex-col items-center">
        <span className="opacity-70 mb-1 font-medium tracking-wide uppercase">Results Found</span>
        <div className="font-bold text-[var(--accent)] text-2xl">
          {totalResults}
        </div>
      </div>
    </div>
  );
}
