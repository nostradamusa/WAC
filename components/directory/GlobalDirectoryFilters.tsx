"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import WacSelect, { WacSelectOption } from "@/components/ui/WacSelect";

type GlobalDirectoryFiltersProps = {
  activeTab: "people" | "entities";
  totalResults: number;
};

export default function GlobalDirectoryFilters({
  activeTab,
  totalResults,
}: GlobalDirectoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // People Filters
  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [industry, setIndustry] = useState(searchParams.get("industry") || "");
  const [specialty, setSpecialty] = useState(
    searchParams.get("specialty") || "",
  );
  const [mentorOnly, setMentorOnly] = useState(
    searchParams.get("mentor") === "true",
  );
  const [openToWork, setOpenToWork] = useState(
    searchParams.get("work") === "true",
  );
  const [openToHire, setOpenToHire] = useState(
    searchParams.get("hire") === "true",
  );

  // Entity Filters (Currently client-side handled in EntitiesTab, but we manage state here)
  const [entityType, setEntityType] = useState(
    searchParams.get("filter") || "all",
  );
  const [entityLocation, setEntityLocation] = useState(
    searchParams.get("location") || "",
  );

  const entityOptions: WacSelectOption[] = [
    { value: "all", label: "All Entities" },
    { value: "businesses", label: "Businesses" },
    { value: "organizations", label: "Organizations" },
  ];

  // Keep state in sync if URL changes externally (e.g. going back)
  useEffect(() => {
    setCountry(searchParams.get("country") || "");
    setIndustry(searchParams.get("industry") || "");
    setSpecialty(searchParams.get("specialty") || "");
    setMentorOnly(searchParams.get("mentor") === "true");
    setOpenToWork(searchParams.get("work") === "true");
    setOpenToHire(searchParams.get("hire") === "true");
    setEntityType(searchParams.get("filter") || "all");
    setEntityLocation(searchParams.get("location") || "");
  }, [searchParams]);

  function handleApplyFilters(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (activeTab === "people") {
      if (country) params.set("country", country);
      else params.delete("country");

      if (industry) params.set("industry", industry);
      else params.delete("industry");

      if (specialty) params.set("specialty", specialty);
      else params.delete("specialty");

      if (mentorOnly) params.set("mentor", "true");
      else params.delete("mentor");

      if (openToWork) params.set("work", "true");
      else params.delete("work");

      if (openToHire) params.set("hire", "true");
      else params.delete("hire");

      // Clear entity specific params when applying people filters
      params.delete("filter");
      params.delete("location");
    } else {
      // Entities Tab
      if (entityType && entityType !== "all") params.set("filter", entityType);
      else params.delete("filter");

      if (entityLocation) params.set("location", entityLocation);
      else params.delete("location");

      // Clear people specific params when applying entity filters
      params.delete("country");
      params.delete("industry");
      params.delete("specialty");
      params.delete("mentor");
      params.delete("work");
      params.delete("hire");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleClearFilters() {
    // Keep only the 'q' (search) parameter and the 'tab' parameter if they exist
    const q = searchParams.get("q");
    const tab = searchParams.get("tab");

    // Clear local state
    setCountry("");
    setIndustry("");
    setSpecialty("");
    setMentorOnly(false);
    setOpenToWork(false);
    setOpenToHire(false);
    setEntityType("all");
    setEntityLocation("");

    // Update URL
    let url = pathname;
    const params = new URLSearchParams();
    if (tab) params.set("tab", tab);
    if (q) params.set("q", q);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    router.push(url);
  }

  return (
    <section className="wac-card p-5 sticky top-24 z-30">
      <div className="mb-5">
        <h2 className="text-lg font-semibold font-serif tracking-tight">
          Focus Directory
        </h2>
        <p className="mt-1 text-xs opacity-70">Tailor your network view.</p>
      </div>

      <form onSubmit={handleApplyFilters} className="space-y-4">
        {activeTab === "people" ? (
          <>
            <div>
              <label
                htmlFor="country"
                className="mb-1.5 block text-xs font-medium opacity-80 uppercase tracking-wider"
              >
                Country
              </label>
              <input
                id="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United States"
                className="w-full rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-5 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label
                htmlFor="industry"
                className="mb-1.5 block text-xs font-medium opacity-80 uppercase tracking-wider"
              >
                Industry
              </label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Healthcare"
                className="w-full rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-5 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label
                htmlFor="specialty"
                className="mb-1.5 block text-xs font-medium opacity-80 uppercase tracking-wider"
              >
                Specialty
              </label>
              <input
                id="specialty"
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Cardiology"
                className="w-full rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-5 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--foreground)]/10">
              <label className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.01)] px-5 py-2.5 text-xs font-medium cursor-pointer hover:border-[var(--accent)]/50 transition">
                <input
                  type="checkbox"
                  checked={mentorOnly}
                  onChange={(e) => setMentorOnly(e.target.checked)}
                  className="accent-[var(--accent)]"
                />
                Open to mentoring
              </label>

              <label className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.01)] px-5 py-2.5 text-xs font-medium cursor-pointer hover:border-[var(--accent)]/50 transition">
                <input
                  type="checkbox"
                  checked={openToWork}
                  onChange={(e) => setOpenToWork(e.target.checked)}
                  className="accent-[var(--accent)]"
                />
                Open to Work
              </label>

              <label className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.01)] px-5 py-2.5 text-xs font-medium cursor-pointer hover:border-[var(--accent)]/50 transition">
                <input
                  type="checkbox"
                  checked={openToHire}
                  onChange={(e) => setOpenToHire(e.target.checked)}
                  className="accent-[var(--accent)]"
                />
                Hiring
              </label>
            </div>
          </>
        ) : (
          <>
            <div>
              <label
                htmlFor="entityType"
                className="mb-1.5 block text-xs font-medium opacity-80 uppercase tracking-wider"
              >
                Entity Type
              </label>
              <WacSelect
                id="entityType"
                options={entityOptions}
                value={entityType}
                onChange={setEntityType}
              />
            </div>

            <div>
              <label
                htmlFor="entityLocation"
                className="mb-1.5 block text-xs font-medium opacity-80 uppercase tracking-wider"
              >
                Location
              </label>
              <input
                id="entityLocation"
                type="text"
                value={entityLocation}
                onChange={(e) => setEntityLocation(e.target.value)}
                placeholder="e.g. New York"
                className="w-full rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-5 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </div>
          </>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="w-full py-3 rounded-full font-bold bg-[var(--accent)] text-black hover:bg-[#F3E5AB] transition-colors shadow-lg shadow-[var(--accent)]/10 text-sm"
          >
            Apply Filters
          </button>
        </div>

        <button
          type="button"
          onClick={handleClearFilters}
          className="w-full block text-center text-xs font-medium opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition py-2"
        >
          Clear all filters
        </button>
      </form>

      <div className="mt-6 rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-5 py-3 text-xs flex justify-between items-center">
        <span className="opacity-70">
          {activeTab === "people" ? "Network Size" : "Entities Indexed"}
        </span>
        <div className="font-bold text-[var(--accent)]">
          {totalResults}{" "}
          <span className="text-[var(--foreground)] opacity-50 font-normal">
            found
          </span>
        </div>
      </div>
    </section>
  );
}
