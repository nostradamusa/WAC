"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FormEvent } from "react";

type PeopleFiltersProps = {
  country?: string;
  industry?: string;
  skills?: string[];
  mentorOnly?: boolean;
  openToWork?: boolean;
  openToHire?: boolean;
  totalResults?: number;
};

export default function PeopleFilters({
  country = "",
  industry = "",
  skills = [],
  mentorOnly = false,
  openToWork = false,
  openToHire = false,
  totalResults = 0,
}: PeopleFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    const q = searchParams.get("q");
    if (q) params.set("q", q);

    const countryVal = formData.get("country") as string;
    const industryVal = formData.get("industry") as string;
    const skillsVal = formData.get("skills") as string;
    const mentorVal = formData.get("mentor") === "true";
    const workVal = formData.get("work") === "true";
    const hireVal = formData.get("hire") === "true";

    if (countryVal?.trim()) params.set("country", countryVal.trim());
    if (industryVal?.trim()) params.set("industry", industryVal.trim());
    if (skillsVal?.trim()) params.set("skills", skillsVal.trim());
    if (mentorVal) params.set("mentor", "true");
    if (workVal) params.set("work", "true");
    if (hireVal) params.set("hire", "true");

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <section className="wac-card p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Filters</h2>
        <p className="mt-1 text-sm opacity-75">
          Narrow the directory by location and expertise.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="country" className="mb-2 block text-sm font-medium">
            Country
          </label>
          <input
            id="country"
            type="text"
            name="country"
            defaultValue={country}
            placeholder="e.g. United States"
            className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label htmlFor="industry" className="mb-2 block text-sm font-medium">
            Industry
          </label>
          <input
            id="industry"
            type="text"
            name="industry"
            defaultValue={industry}
            placeholder="e.g. Healthcare"
            className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label htmlFor="skills" className="mb-2 block text-sm font-medium">
            Skills
          </label>
          <input
            id="skills"
            type="text"
            name="skills"
            defaultValue={skills.join(", ")}
            placeholder="e.g. React.js, Python"
            className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          />
          <p className="mt-1 text-xs opacity-50">Comma-separated</p>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm cursor-pointer hover:border-[var(--accent)]/50 transition">
          <input
            type="checkbox"
            name="mentor"
            value="true"
            defaultChecked={mentorOnly}
            className="accent-[var(--accent)]"
          />
          Open to mentoring
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm cursor-pointer hover:border-[var(--accent)]/50 transition">
          <input
            type="checkbox"
            name="work"
            value="true"
            defaultChecked={openToWork}
            className="accent-[var(--accent)]"
          />
          Open to work
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm cursor-pointer hover:border-[var(--accent)]/50 transition">
          <input
            type="checkbox"
            name="hire"
            value="true"
            defaultChecked={openToHire}
            className="accent-[var(--accent)]"
          />
          Open to hire
        </label>

        <div className="flex gap-3 pt-4">
          <button type="submit" className="wac-button-primary w-full">
            Apply Filters
          </button>
        </div>

        <Link
          href="/people"
          className="block text-center text-sm font-medium underline opacity-80"
        >
          Clear all filters
        </Link>
      </form>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm">
        <span className="font-semibold">{totalResults}</span>{" "}
        {totalResults === 1 ? "person found" : "people found"}
      </div>
    </section>
  );
}
