import SearchableSelect from "@/components/profile/SearchableSelect";

type Industry = {
  id: string;
  name: string;
};

type Profession = {
  id: string;
  name: string;
  industry_id: string;
};

type Specialty = {
  id: string;
  name: string;
  industry_id: string;
};

type ProfileCareerSectionProps = {
  headline: string;
  setHeadline: React.Dispatch<React.SetStateAction<string>>;
  industryId: string;
  handleIndustryChange: (newIndustryId: string) => void;
  industries: Industry[];
  professionId: string;
  handleProfessionChange: (newProfessionId: string) => void;
  filteredProfessions: Profession[];
  selectedIndustryName: string;
  specialtyId: string;
  setSpecialtyId: React.Dispatch<React.SetStateAction<string>>;
  filteredSpecialties: Specialty[];
};

export default function ProfileCareerSection({
  headline,
  setHeadline,
  industryId,
  handleIndustryChange,
  industries,
  professionId,
  handleProfessionChange,
  filteredProfessions,
  selectedIndustryName,
  specialtyId,
  setSpecialtyId,
  filteredSpecialties,
}: ProfileCareerSectionProps) {
  const industryOptions = industries.map((industry) => ({
    value: industry.id,
    label: industry.name,
  }));

  const professionOptions = filteredProfessions.map((profession) => ({
    value: profession.id,
    label: profession.name,
  }));

  const specialtyOptions = filteredSpecialties.map((specialty) => ({
    value: specialty.id,
    label: specialty.name,
  }));

  return (
    <div className="grid gap-4">
      <div id="profile-field-headline">
        <label className="block text-sm font-bold text-white/90 mb-2.5">Headline</label>
        <input
          id="headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Founder of the World Albanian Congress / Pharmaceutical Sales Professional"
          className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div id="profile-field-industryId">
          <label className="block text-sm font-bold text-white/90 mb-2.5">Industry</label>
          <SearchableSelect
            value={industryId}
            onChange={handleIndustryChange}
            options={industryOptions}
            placeholder="Select an industry"
            searchPlaceholder="Search industries..."
            emptyMessage="No industries found."
          />
        </div>

        <div id="profile-field-professionId">
          <label className="block text-sm font-bold text-white/90 mb-2.5">Profession</label>
          <SearchableSelect
            value={professionId}
            onChange={handleProfessionChange}
            options={professionOptions}
            placeholder={
              industryId ? "Select a profession" : "Choose industry first"
            }
            searchPlaceholder="Search professions..."
            emptyMessage="No professions found."
            disabled={!industryId}
          />
        </div>
      </div>

      {selectedIndustryName === "Healthcare" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div id="profile-field-specialtyId">
            <label className="block text-sm font-bold text-white/90 mb-2.5">Specialty</label>
            <SearchableSelect
              value={specialtyId}
              onChange={setSpecialtyId}
              options={specialtyOptions}
              placeholder={
                professionId ? "Select a specialty" : "Choose profession first"
              }
              searchPlaceholder="Search specialties..."
              emptyMessage="No specialties found."
            />
          </div>
        </div>
      )}
    </div>
  );
}
