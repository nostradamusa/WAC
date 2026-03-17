import SearchableSelect from "./SearchableSelect";

type Skill = {
  id: string;
  name: string;
  category: string | null;
};

type ProfileSkillsSectionProps = {
  industryId: string;
  professionId: string;
  filteredSkills: Skill[];
  allSkills: Skill[];
  selectedSkillIds: string[];
  setSelectedSkillIds: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function ProfileSkillsSection({
  industryId,
  professionId,
  filteredSkills,
  allSkills,
  selectedSkillIds,
  setSelectedSkillIds,
}: ProfileSkillsSectionProps) {
  // Create a fast lookup for suggested skills
  const suggestedSkillIds = new Set(filteredSkills.map((s) => s.id));

  // Sort: Suggestions first, then alphabetically by name
  const sortedGlobalSkills = [...allSkills].sort((a, b) => {
    const aIsSuggested = suggestedSkillIds.has(a.id);
    const bIsSuggested = suggestedSkillIds.has(b.id);

    if (aIsSuggested && !bIsSuggested) return -1;
    if (!aIsSuggested && bIsSuggested) return 1;

    return a.name.localeCompare(b.name);
  });

  return (
    <div id="profile-field-skills-search">
      <label className="block text-sm font-bold text-white/90 mb-2.5">Skills</label>

      <div className="space-y-6 mt-2">
        <div className="relative">
          <SearchableSelect
            value=""
            onChange={(skillId) => {
              if (skillId && !selectedSkillIds.includes(skillId)) {
                setSelectedSkillIds((prev) => [...prev, skillId]);
              }
            }}
            options={sortedGlobalSkills
              .filter((s) => !selectedSkillIds.includes(s.id))
              .map((s) => ({
                value: s.id,
                label: suggestedSkillIds.has(s.id)
                  ? `★ ${s.name} (Suggested)`
                  : s.name,
              }))}
            placeholder="Search thousands of skills..."
            searchPlaceholder="Type to search global skills..."
            emptyMessage="No skills found matching your search."
          />
        </div>

        <div className="min-h-[120px] pt-2">
          <label className="block text-sm font-bold text-white/90 mb-2.5">Your Expertises</label>

          <div className="flex flex-wrap gap-3">
            {selectedSkillIds.length === 0 ? (
              <div className="text-sm opacity-50 w-full text-center py-4">
                Add skills above to highlight your expertise.
              </div>
            ) : (
              allSkills
                .filter((skill) => selectedSkillIds.includes(skill.id))
                .map((skill) => (
                  <div
                    key={skill.id}
                    className="group flex flex-wrap items-center gap-2 bg-[rgba(176,141,87,0.12)] border border-[rgba(176,141,87,0.3)] text-white px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:border-[rgba(176,141,87,0.6)]"
                  >
                    <span className="max-w-[calc(100vw-8rem)] truncate">
                      {skill.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSkillIds((prev) =>
                          prev.filter((id) => id !== skill.id),
                        )
                      }
                      className="opacity-50 hover:opacity-100 hover:text-red-400 focus:outline-none transition-colors ml-1 p-0.5"
                      aria-label={`Remove ${skill.name}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                ))
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs opacity-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            These skills power your visibility in the Global Directory Search.
          </div>
        </div>
      </div>
    </div>
  );
}
