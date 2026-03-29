"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import SearchableCombobox from "@/components/ui/SearchableCombobox";
import SearchableMultiSelect from "@/components/ui/SearchableMultiSelect";
import type { ComboboxOption } from "@/components/ui/SearchableCombobox";
import { useTaxonomies } from "@/hooks/useTaxonomies";
import { DIASPORA_COUNTRIES } from "@/lib/constants/locations";
import { PROPERTIES_ENABLED } from "@/lib/constants/featureFlags";

// ── Constants ──────────────────────────────────────────────────────────────────

const SCOPES = [
  { value: "all",           label: "All",           isSoon: false },
  { value: "people",        label: "People",        isSoon: false },
  { value: "businesses",    label: "Businesses",    isSoon: false },
  { value: "organizations", label: "Organizations", isSoon: false },
  { value: "properties",    label: "Properties",    isSoon: !PROPERTIES_ENABLED },
];

const INTENT_OPTIONS = [
  { key: "mentor", label: "Mentoring" },
  { key: "hire",   label: "Hiring" },
  { key: "work",   label: "Open to Work" },
  { key: "collab", label: "Collaborating" },
] as const;

const SIGNAL_OPTIONS = [
  { key: "active",   label: "Most Active",     soon: false },
  { key: "recent",   label: "Recently Active", soon: false },
  { key: "verified", label: "Verified",         soon: true  },
] as const;

const SORT_OPTIONS = [
  { value: "relevant", label: "Most Relevant",  soon: false },
  { value: "active",   label: "Most Active",    soon: false },
  { value: "newest",   label: "Newest Members", soon: false },
  { value: "cousin",   label: "Highest CUSI",   soon: true  },
] as const;

const LISTING_TYPE_OPTIONS: ComboboxOption[] = [
  { value: "", label: "Any Context" },
  { value: "sale", label: "For Sale" },
  { value: "long_term", label: "Long-Term Rental" },
  { value: "short_term", label: "Short-Term / Vacation" },
  { value: "commercial", label: "Commercial Lease" },
];

const PROPERTY_TYPE_OPTIONS: ComboboxOption[] = [
  { value: "", label: "Any Type" },
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "land", label: "Land" },
  { value: "commercial_unit", label: "Commercial" },
  { value: "hotel", label: "Hotel" },
  { value: "guesthouse", label: "Guest House" },
  { value: "multi_family", label: "Multi-Family" },
];

const BEDROOM_OPTIONS: ComboboxOption[] = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function chipCls(active: boolean) {
  return `inline-flex items-center px-2.5 py-[5px] rounded-full border text-[11px] font-medium transition-all select-none ${
    active
      ? "bg-[#b08d57]/[0.10] border-[#b08d57]/28 text-[#b08d57]/90"
      : "bg-white/[0.03] border-white/[0.07] text-white/38 hover:text-white/60 hover:border-white/[0.13]"
  }`;
}

const sectionLabel =
  "text-[9px] font-bold uppercase tracking-[0.14em] text-white/22 mb-2";

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  totalResults?: number;
  scope: "all" | "people" | "businesses" | "organizations" | "properties";
  filterId?: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function GlobalDirectoryFilters({
  scope,
  totalResults,
  filterId = "directory-filter-form",
}: Props) {
  const searchParams = useSearchParams();
  const pathname     = usePathname();
  const router       = useRouter();

  const isPeople     = scope === "all" || scope === "people";
  const isProperties = scope === "properties";
  const currentSort  = searchParams.get("sort") || "relevant";

  const { industries, professions, skills, isLoading } = useTaxonomies();

  // Local state to bind comboboxes to the form for mobile apply button
  const [countryVal, setCountryVal] = useState(searchParams.get("country") || "");
  const [industryVal, setIndustryVal] = useState(searchParams.get("industry") || "");
  const [professionVal, setProfessionVal] = useState(searchParams.get("profession") || "");
  const [skillVal, setSkillVal] = useState<string[]>(searchParams.getAll("skills"));
  const [listingTypeVal, setListingTypeVal] = useState(searchParams.get("listing_type") || "");
  const [propertyTypeVal, setPropertyTypeVal] = useState(searchParams.get("property_type") || "");
  const [bedroomsVal, setBedroomsVal] = useState(searchParams.get("bedrooms") || "");

  // Progressive disclosure — Advanced section collapsed by default
  const hasAdvancedActive = !!(
    searchParams.get("active") === "true" ||
    searchParams.get("recent") === "true" ||
    searchParams.get("verified") === "true" ||
    (searchParams.get("sort") && searchParams.get("sort") !== "relevant")
  );
  const [advancedOpen, setAdvancedOpen] = useState(hasAdvancedActive);

  // Sync state if URL changes organically
  useEffect(() => {
    setCountryVal(searchParams.get("country") || "");
    setIndustryVal(searchParams.get("industry") || "");
    setProfessionVal(searchParams.get("profession") || "");
    setSkillVal(searchParams.getAll("skills"));
    setListingTypeVal(searchParams.get("listing_type") || "");
    setPropertyTypeVal(searchParams.get("property_type") || "");
    setBedroomsVal(searchParams.get("bedrooms") || "");
  }, [searchParams]);

  const triggerSubmit = () => {
    setTimeout(() => {
      const form = document.getElementById(filterId) as HTMLFormElement;
      if (form) form.requestSubmit();
    }, 0);
  };

  // ── URL builders ──────────────────────────────────────────────────────────

  function buildScopeHref(s: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (s === "all") p.delete("scope"); else p.set("scope", s);
    return p.toString() ? `${pathname}?${p.toString()}` : pathname;
  }

  function buildToggleHref(key: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (p.get(key) === "true") p.delete(key); else p.set(key, "true");
    return p.toString() ? `${pathname}?${p.toString()}` : pathname;
  }

  function buildSortHref(sort: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (sort === "relevant") p.delete("sort"); else p.set("sort", sort);
    return p.toString() ? `${pathname}?${p.toString()}` : pathname;
  }

  // ── Form submit (location + taxonomy) ────────────────────────────────

  function handleApplyFilters(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data   = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());

    const country  = ((data.get("country")  as string) || "").trim();
    const industry = ((data.get("industry") as string) || "").trim();
    const profession = ((data.get("profession") as string) || "").trim();
    const skillsArr = (data.getAll("skills") as string[]).map(s => s.trim()).filter(Boolean);
    const listingType = ((data.get("listing_type") as string) || "").trim();
    const propertyType = ((data.get("property_type") as string) || "").trim();
    const bedrooms = ((data.get("bedrooms") as string) || "").trim();

    if (country)  params.set("country",  country);  else params.delete("country");
    if (industry) params.set("industry", industry); else params.delete("industry");
    if (profession) params.set("profession", profession); else params.delete("profession");
    if (listingType) params.set("listing_type", listingType); else params.delete("listing_type");
    if (propertyType) params.set("property_type", propertyType); else params.delete("property_type");
    if (bedrooms) params.set("bedrooms", bedrooms); else params.delete("bedrooms");

    params.delete("skills");
    skillsArr.forEach(s => params.append("skills", s));

    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  // Helper functions for options
  const mapToOptions = (items: {id: string; name: string}[]): ComboboxOption[] => {
    const defaultOption: ComboboxOption = { value: "", label: "Any" };
    if (!items || items.length === 0) return [defaultOption];
    return [defaultOption, ...items.map(i => ({ value: i.name, label: i.name }))];
  };

  const LOCATION_OPTIONS: ComboboxOption[] = [
    { value: "", label: "Any" },
    ...DIASPORA_COUNTRIES.map(c => ({
      value: c.canonicalName,
      label: c.canonicalName,
      aliases: c.aliases,
    })),
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* ═══════════════════════════════════════════════════════════════════
          Section 1 — TYPE
          First decision: what kind of entity?
          ═════════════════════════════════════════════════════════════════ */}
      <div className="py-3.5 border-b border-white/[0.05]">
        <p className={sectionLabel}>Type</p>
        <div className="flex flex-wrap gap-1.5">
          {SCOPES.map(({ value, label, isSoon }) =>
            isSoon ? (
              <span
                key={value}
                className="inline-flex items-center gap-1 px-2.5 py-[5px] rounded-full border border-white/[0.05] text-[11px] font-medium text-white/20 cursor-default select-none"
              >
                {label}
                <span className="text-[#b08d57]/38 text-[8px] font-bold uppercase tracking-wide">Soon</span>
              </span>
            ) : (
              <a key={value} href={buildScopeHref(value)} className={chipCls(scope === value)}>
                {label}
              </a>
            )
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          Section 2 — LOCATION
          After type, most users think geographically.
          Alias-aware typeahead with canonical matching.
          ═════════════════════════════════════════════════════════════════ */}
      <form id={filterId} onSubmit={handleApplyFilters}>

        <div className="py-3.5 border-b border-white/[0.05]">
          <p className={sectionLabel}>Location</p>
          <input type="hidden" name="country" value={countryVal} />
          <SearchableCombobox
            value={countryVal}
            onChange={(val) => { setCountryVal(val); triggerSubmit(); }}
            options={LOCATION_OPTIONS}
            placeholder="Search country or region..."
          />
          <p className="mt-1.5 text-[9px] text-white/14 leading-snug">
            Accepts English, Albanian, and local name variants
          </p>
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            Section 3 — FIELD / INDUSTRY
            Professional or business domain — broad first.
            Shown for people, businesses, organizations (not properties).
            ═══════════════════════════════════════════════════════════════ */}
        {!isProperties && (
          <div className="py-3.5 border-b border-white/[0.05]">
            <p className={sectionLabel}>Field / Industry</p>
            <input type="hidden" name="industry" value={industryVal} />
            <SearchableCombobox
              value={industryVal}
              onChange={(val) => { setIndustryVal(val); triggerSubmit(); }}
              options={mapToOptions(industries)}
              placeholder={isLoading ? "Loading..." : "Healthcare, Technology, Finance..."}
              disabled={isLoading}
            />
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            Section 3 (Properties) — LISTING TYPE
            Replaces industry when in properties scope.
            ═══════════════════════════════════════════════════════════════ */}
        {isProperties && (
          <div className="py-3.5 border-b border-white/[0.05]">
            <p className={sectionLabel}>Listing Type</p>
            <input type="hidden" name="listing_type" value={listingTypeVal} />
            <SearchableCombobox
              value={listingTypeVal}
              onChange={(val) => { setListingTypeVal(val); triggerSubmit(); }}
              options={LISTING_TYPE_OPTIONS}
              placeholder="Buy, Rent, Commercial..."
            />
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════
            Section 4 — SPECIALTY
            Deeper narrowing inside field/type.
            Progressive: only shown when contextually relevant.

            For people: Profession + Skills
            For properties: Property Type + Bedrooms
            ═══════════════════════════════════════════════════════════════ */}
        {isPeople && (
          <div className="py-3.5 border-b border-white/[0.05]">
            <p className={sectionLabel}>Specialty</p>
            <div className="space-y-3">
              {/* Profession */}
              <div>
                <input type="hidden" name="profession" value={professionVal} />
                <SearchableCombobox
                  value={professionVal}
                  onChange={(val) => { setProfessionVal(val); triggerSubmit(); }}
                  options={mapToOptions(professions)}
                  placeholder={isLoading ? "Loading..." : "Profession or role..."}
                  disabled={isLoading}
                />
              </div>

              {/* Skills */}
              <div>
                {skillVal.map(s => <input key={s} type="hidden" name="skills" value={s} />)}
                <SearchableMultiSelect
                  value={skillVal}
                  onChange={(vals) => { setSkillVal(vals); triggerSubmit(); }}
                  options={mapToOptions(skills)}
                  placeholder={isLoading ? "Loading..." : "Key skills..."}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {isProperties && (
          <div className="py-3.5 border-b border-white/[0.05]">
            <p className={sectionLabel}>Property Details</p>
            <div className="space-y-3">
              {/* Property Type */}
              <div>
                <input type="hidden" name="property_type" value={propertyTypeVal} />
                <SearchableCombobox
                  value={propertyTypeVal}
                  onChange={(val) => { setPropertyTypeVal(val); triggerSubmit(); }}
                  options={PROPERTY_TYPE_OPTIONS}
                  placeholder="House, Villa, Apartment..."
                />
              </div>

              {/* Bedrooms */}
              <div>
                <input type="hidden" name="bedrooms" value={bedroomsVal} />
                <SearchableCombobox
                  value={bedroomsVal}
                  onChange={(val) => { setBedroomsVal(val); triggerSubmit(); }}
                  options={BEDROOM_OPTIONS}
                  placeholder="Minimum bedrooms"
                />
              </div>
            </div>
          </div>
        )}

      </form>

      {/* ═══════════════════════════════════════════════════════════════════
          Section 5 — INTENT / OPPORTUNITY
          Important but secondary to type/location/field.
          Shows for people-related scopes only.
          ═════════════════════════════════════════════════════════════════ */}
      {isPeople && (
        <div className="py-3.5 border-b border-white/[0.05]">
          <p className={sectionLabel}>Intent</p>
          <div className="flex flex-wrap gap-1.5">
            {INTENT_OPTIONS.map(({ key, label }) => (
              <a key={key} href={buildToggleHref(key)} className={chipCls(searchParams.get(key) === "true")}>
                {label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          Section 6 — ADVANCED
          Signals + Sort. Collapsed by default via progressive disclosure.
          Expands automatically if any advanced filter is already active.
          ═════════════════════════════════════════════════════════════════ */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setAdvancedOpen(v => !v)}
          className="w-full flex items-center justify-between py-3 group"
        >
          <span className={`${sectionLabel} mb-0 group-hover:text-white/32 transition-colors`}>
            Advanced
            {hasAdvancedActive && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[14px] h-[14px] rounded-full bg-[#b08d57]/15 text-[8px] font-bold text-[#b08d57]/80 px-1 leading-none align-middle">
                {[
                  searchParams.get("active") === "true",
                  searchParams.get("recent") === "true",
                  searchParams.get("verified") === "true",
                  searchParams.get("sort") && searchParams.get("sort") !== "relevant",
                ].filter(Boolean).length}
              </span>
            )}
          </span>
          <ChevronDown
            size={12}
            className={`text-white/18 group-hover:text-white/32 transition-all duration-200 ${
              advancedOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className={`overflow-hidden transition-all duration-200 ease-out ${
            advancedOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {/* Signals */}
          {!isProperties && (
            <div className="pb-3.5 border-b border-white/[0.05]">
              <p className={sectionLabel}>Signals</p>
              <div className="flex flex-wrap gap-1.5">
                {SIGNAL_OPTIONS.map(({ key, label, soon }) =>
                  soon ? (
                    <span
                      key={key}
                      className="inline-flex items-center px-2.5 py-[5px] rounded-full border border-white/[0.05] text-[11px] font-medium text-white/16 cursor-default select-none"
                    >
                      {label}
                      <span className="ml-1.5 text-[#b08d57]/38 text-[9px] font-bold uppercase tracking-wide">soon</span>
                    </span>
                  ) : (
                    <a key={key} href={buildToggleHref(key)} className={chipCls(searchParams.get(key) === "true")}>
                      {label}
                    </a>
                  )
                )}
                <span className="inline-flex items-center px-2.5 py-[5px] rounded-full border border-white/[0.05] text-[11px] font-medium text-white/16 cursor-default select-none">
                  CUSI
                  <span className="ml-1.5 text-[#b08d57]/38 text-[9px] font-bold uppercase tracking-wide">soon</span>
                </span>
              </div>
            </div>
          )}

          {/* Sort */}
          <div className="py-3.5">
            <p className={sectionLabel}>Sort</p>
            <div className="space-y-px">
              {SORT_OPTIONS.map(({ value, label, soon }) =>
                soon ? (
                  <div key={value} className="flex items-center gap-3 px-2 py-[7px] opacity-20 cursor-default">
                    <span className="w-3 h-3 rounded-full border border-white/20 shrink-0" />
                    <span className="text-[12px] text-white/40 flex-1">{label}</span>
                    <span className="text-[8px] font-bold text-[#b08d57]/50 uppercase tracking-wide">Soon</span>
                  </div>
                ) : (
                  <a
                    key={value}
                    href={buildSortHref(value)}
                    className={`flex items-center gap-3 w-full px-2 py-[7px] rounded-lg transition-colors ${
                      currentSort === value ? "bg-white/[0.05]" : "hover:bg-white/[0.025]"
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      currentSort === value
                        ? "border-[#b08d57]/50 bg-[#b08d57]/15"
                        : "border-white/[0.12]"
                    }`}>
                      {currentSort === value && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b08d57]" />
                      )}
                    </span>
                    <span className={`text-[12px] font-medium transition-colors ${
                      currentSort === value ? "text-white/75" : "text-white/38"
                    }`}>
                      {label}
                    </span>
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
