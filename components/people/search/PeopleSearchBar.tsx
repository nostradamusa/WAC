type PeopleSearchBarProps = {
  initialQuery?: string;
  activeTab?: "people" | "entities";
};

export default function PeopleSearchBar({
  initialQuery = "",
  activeTab = "people",
}: PeopleSearchBarProps) {
  return (
    <section className="wac-card mb-6 p-5">
      <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <input
          type="text"
          name="q"
          defaultValue={initialQuery}
          placeholder={
            activeTab === "people"
              ? "e.g., 'Software Engineers from Tirana living in New York open to mentoring...'"
              : "e.g., 'Tech Startups in Pristina looking for investors...'"
          }
          className="rounded-full border border-[var(--border)] bg-transparent px-6 py-3 outline-none transition focus:border-[var(--accent)]"
        />

        <input type="hidden" name="tab" value={activeTab} />

        <div className="flex gap-3">
          <button 
            type="submit" 
            className="px-8 py-3 rounded-full font-medium tracking-wide transition-all flex items-center gap-2 bg-[var(--accent)]/10 border border-[var(--accent)]/50 text-[#D4AF37] shadow-[0_0_20px_rgba(176,141,87,0.1)] hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]"
          >
            Search
          </button>

          <a
            href={`/directory${activeTab === "entities" ? "?tab=entities" : ""}`}
            className="px-8 py-3 rounded-full font-medium tracking-wide transition-all flex items-center gap-2 bg-white/5 border border-[var(--border)] hover:border-white/20 text-white/70 hover:text-white justify-center"
          >
            Clear
          </a>
        </div>
      </form>
    </section>
  );
}
