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
      <div>
        <label htmlFor="headline">Headline</label>
        <br />
        <input
          id="headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Founder of the World Albanian Congress / Pharmaceutical Sales Professional"
          className="w-full p-2.5 mt-1.5"
        />
      </div>

      <div>
        <label>Industry</label>
        <SearchableSelect
          value={industryId}
          onChange={handleIndustryChange}
          options={industryOptions}
          placeholder="Select an industry"
          searchPlaceholder="Search industries..."
          emptyMessage="No industries found."
        />
      </div>

      <div>
        <label>Profession</label>
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

      {selectedIndustryName === "Healthcare" && (
        <div>
          <label>Specialty</label>
          <SearchableSelect
            value={specialtyId}
            onChange={setSpecialtyId}
            options={specialtyOptions}
            placeholder="Select a specialty"
            searchPlaceholder="Search specialties..."
            emptyMessage="No specialties found."
          />
        </div>
      )}
    </div>
  );
}
