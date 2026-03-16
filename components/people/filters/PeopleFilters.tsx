type PeopleFiltersProps = {
  country?: string;
  industry?: string;
  specialty?: string;
  mentorOnly?: boolean;
  openToWork?: boolean;
  openToHire?: boolean;
  totalResults?: number;
};

export default function PeopleFilters({
  country = "",
  industry = "",
  specialty = "",
  mentorOnly = false,
  openToWork = false,
  openToHire = false,
  totalResults = 0,
}: PeopleFiltersProps) {
  return (
    <section className="wac-card p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Filters</h2>
        <p className="mt-1 text-sm opacity-75">
          Narrow the directory by location and expertise.
        </p>
      </div>

      <form className="space-y-4">
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
          <label htmlFor="specialty" className="mb-2 block text-sm font-medium">
            Specialty
          </label>
          <input
            id="specialty"
            type="text"
            name="specialty"
            defaultValue={specialty}
            placeholder="e.g. Cardiology"
            className="w-full rounded-2xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          />
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
          <input
            type="checkbox"
            name="mentor"
            value="true"
            defaultChecked={mentorOnly}
          />
          Open to mentoring only
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
          <input
            type="checkbox"
            name="work"
            value="true"
            defaultChecked={openToWork}
          />
          Open to work
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
          <input
            type="checkbox"
            name="hire"
            value="true"
            defaultChecked={openToHire}
          />
          Open to hire
        </label>

        <div className="flex gap-3 pt-4">
          <button type="submit" className="wac-button-primary w-full">
            Apply Filters
          </button>
        </div>

        <a
          href="/people"
          className="block text-center text-sm font-medium underline opacity-80"
        >
          Clear all filters
        </a>
      </form>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm">
        <span className="font-semibold">{totalResults}</span>{" "}
        {totalResults === 1 ? "person found" : "people found"}
      </div>
    </section>
  );
}
