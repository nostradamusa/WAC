"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, ChevronUp, Trash2, GripVertical, Building2 } from "lucide-react";

type ExperienceItem = {
  id: string;
  company: string;
  title: string;
  industryTag: string;
  website: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
};

type ProfileExperienceSectionProps = {
  onHasExperienceChange?: (hasExperience: boolean) => void;
};

type ProfileExperienceRow = {
  id: string;
  profile_id: string;
  title: string;
  company: string;
  employment_type: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
};

function createEmptyExperience(): ExperienceItem {
  return {
    id: crypto.randomUUID(),
    company: "",
    title: "",
    industryTag: "",
    website: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  };
}

function toYearInputValue(dateValue: string | null) {
  if (!dateValue) return "";
  return dateValue.slice(0, 4);
}

function toDbDateFromYear(yearValue: string) {
  if (!yearValue.trim()) return null;
  const normalizedYear = yearValue.trim();
  if (!/^\d{4}$/.test(normalizedYear)) return null;
  return `${normalizedYear}-01-01`;
}

function isPersistableExperience(experience: ExperienceItem) {
  return experience.company.trim().length > 0 && experience.title.trim().length > 0;
}

function mapRowToExperience(row: ProfileExperienceRow): ExperienceItem {
  return {
    id: row.id,
    company: row.company ?? "",
    title: row.title ?? "",
    industryTag: "",
    website: "",
    location: row.location ?? "",
    startDate: toYearInputValue(row.start_date),
    endDate: toYearInputValue(row.end_date),
    isCurrent: row.is_current ?? false,
    description: row.description ?? "",
  };
}

export default function ProfileExperienceSection({
  onHasExperienceChange,
}: ProfileExperienceSectionProps) {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [experiences, setExperiences] = useState<ExperienceItem[]>([createEmptyExperience()]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const hasInitializedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistableExperiences = useMemo(() => {
    return experiences.filter(isPersistableExperience);
  }, [experiences]);

  useEffect(() => {
    onHasExperienceChange?.(persistableExperiences.length > 0);
  }, [persistableExperiences.length, onHasExperienceChange]);

  useEffect(() => {
    async function loadExperiences() {
      setIsLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setProfileId(null);
        setExperiences([createEmptyExperience()]);
        setIsLoading(false);
        hasInitializedRef.current = true;
        return;
      }

      const uid = userData.user.id;
      setProfileId(uid);

      const { data, error } = await supabase
        .from("profile_experiences")
        .select(`id, profile_id, title, company, employment_type, location, start_date, end_date, is_current, description, created_at, updated_at`)
        .eq("profile_id", uid)
        .order("created_at", { ascending: true });

      if (error) {
        setExperiences([createEmptyExperience()]);
        setIsLoading(false);
        hasInitializedRef.current = true;
        return;
      }

      const rows = (data ?? []) as ProfileExperienceRow[];

      if (rows.length > 0) {
        setExperiences(rows.map(mapRowToExperience));
      } else {
        const initial = createEmptyExperience();
        setExperiences([initial]);
        setExpandedId(initial.id);
      }

      setIsLoading(false);
      hasInitializedRef.current = true;
    }

    loadExperiences();

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasInitializedRef.current) return;
    if (!profileId) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveState("saving");

      const baseTime = Date.now();
      const rowsToSave = persistableExperiences.map((experience, index) => ({
        profile_id: profileId,
        title: experience.title.trim(),
        company: experience.company.trim(),
        employment_type: null,
        location: experience.location.trim() || null,
        start_date: toDbDateFromYear(experience.startDate),
        end_date: experience.isCurrent ? null : toDbDateFromYear(experience.endDate),
        is_current: experience.isCurrent,
        description: experience.description.trim() || null,
        created_at: new Date(baseTime + index * 1000).toISOString(),
      }));

      const { error: deleteError } = await supabase.from("profile_experiences").delete().eq("profile_id", profileId);

      if (deleteError) {
        setSaveState("error");
        return;
      }

      if (rowsToSave.length > 0) {
        const { error: insertError } = await supabase.from("profile_experiences").insert(rowsToSave);
        if (insertError) {
          setSaveState("error");
          return;
        }
      }

      setSaveState("saved");
      window.setTimeout(() => setSaveState((prev) => (prev === "saved" ? "idle" : prev)), 1200);
    }, 700);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [experiences, persistableExperiences, profileId]);

  function updateExperience(id: string, field: keyof ExperienceItem, value: string | boolean) {
    setExperiences((prev) =>
      prev.map((experience) => {
        if (experience.id !== id) return experience;
        if (field === "isCurrent") {
          const isCurrent = Boolean(value);
          return { ...experience, isCurrent, endDate: isCurrent ? "" : experience.endDate };
        }
        return { ...experience, [field]: value };
      })
    );
  }

  function addExperience() {
    const newExp = createEmptyExperience();
    setExperiences((prev) => [...prev, newExp]);
    setExpandedId(newExp.id);
  }

  function removeExperience(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setExperiences((prev) => {
      if (prev.length === 1) return [createEmptyExperience()];
      return prev.filter((exp) => exp.id !== id);
    });
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", ""); // Required for Firefox
    }
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setExperiences((prev) => {
      const newArray = [...prev];
      const draggedItem = newArray[draggedIndex];
      newArray.splice(draggedIndex, 1);
      newArray.splice(index, 0, draggedItem);
      // Immediately update dragged index to the new position
      setDraggedIndex(index);
      return newArray;
    });
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setActiveDragId(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {isLoading && (
        <div className="p-3 rounded-xl border border-dashed border-[#555] opacity-85 text-sm">
          Loading experience...
        </div>
      )}

      <div className="flex flex-col gap-4">
        {experiences.map((experience, index) => {
          const isExpanded = expandedId === experience.id;
          const displayTitle = experience.title || "Job Title";
          const displayCompany = experience.company || "Company Name";
          const displayYears =
            experience.startDate
              ? `${experience.startDate} — ${experience.isCurrent ? "Present" : experience.endDate || "?"}`
              : "Dates Unknown";

          return (
            <div 
              key={experience.id}
              draggable={activeDragId === experience.id}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all duration-200 hover:bg-white/10 ${draggedIndex === index ? 'opacity-40 scale-[0.98]' : 'opacity-100'}`}
            >
              {/* Accordion Header */}
              <div
                onClick={() => toggleExpand(experience.id)}
                className="p-4 flex items-center justify-between cursor-pointer select-none group"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="opacity-40 hover:opacity-100 transition cursor-grab active:cursor-grabbing p-1"
                    onMouseEnter={() => setActiveDragId(experience.id)}
                    onMouseLeave={() => setActiveDragId(null)}
                  >
                    <GripVertical size={16} />
                  </div>
                  <div>
                    <h4 className="m-0 text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
                      {displayTitle}
                      {experience.isCurrent && (
                        <span className="text-[10px] uppercase tracking-wider bg-[#bd9a3f]/20 text-[#b08d57] px-2 py-0.5 rounded-full font-bold">
                          Current
                        </span>
                      )}
                    </h4>
                    <div className="text-sm opacity-70 flex items-center gap-2 mt-0.5">
                      <span>{displayCompany}</span>
                      <span className="opacity-50">•</span>
                      <span>{displayYears}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => removeExperience(e, experience.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-white/50"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="p-1 rounded-full bg-white/5">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="p-5 md:p-6 border-t border-[var(--border)] bg-[#111] grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-white/90 mb-2.5">Company</label>
                      <input
                        value={experience.company}
                        onChange={(e) => updateExperience(experience.id, "company", e.target.value)}
                        placeholder="e.g. AbbVie"
                        className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-white/90 mb-2.5">Title</label>
                      <input
                        value={experience.title}
                        onChange={(e) => updateExperience(experience.id, "title", e.target.value)}
                        placeholder="e.g. Sr. Specialty GI Representative"
                        className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-bold text-white/90 mb-2.5">Industry Tag</label>
                      <input
                        value={experience.industryTag}
                        onChange={(e) => updateExperience(experience.id, "industryTag", e.target.value)}
                        placeholder="e.g. Pharma"
                        className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-white/90 mb-2.5">Website <span className="opacity-50 font-normal">(Optional)</span></label>
                      <input
                        type="url"
                        value={experience.website}
                        onChange={(e) => updateExperience(experience.id, "website", e.target.value)}
                        placeholder="https://"
                        className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white/90 mb-2.5">Location</label>
                    <input
                      value={experience.location}
                      onChange={(e) => updateExperience(experience.id, "location", e.target.value)}
                      placeholder="e.g. New Jersey, USA"
                      className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-bold text-white/90 mb-2.5">Start Year</label>
                      <input
                        type="number"
                        min="1950" max="2100" inputMode="numeric"
                        value={experience.startDate}
                        onChange={(e) => updateExperience(experience.id, "startDate", e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                        placeholder="YYYY"
                        className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-bold text-white/90 mb-2.5">End Year</label>
                      <input
                        type="number"
                        min="1950" max="2100" inputMode="numeric"
                        value={experience.endDate}
                        onChange={(e) => updateExperience(experience.id, "endDate", e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                        disabled={experience.isCurrent}
                        placeholder={experience.isCurrent ? "Present" : "YYYY"}
                        className={`w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] ${experience.isCurrent ? "opacity-40 cursor-not-allowed" : "opacity-100"}`}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div className={`w-11 h-6 shrink-0 rounded-full flex items-center p-1 transition-colors ${experience.isCurrent ? 'bg-emerald-500' : 'bg-white/20'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${experience.isCurrent ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="font-bold text-sm text-white">I currently work here</span>
                    <input
                      type="checkbox"
                      checked={experience.isCurrent}
                      onChange={(e) => updateExperience(experience.id, "isCurrent", e.target.checked)}
                      className="hidden"
                    />
                  </label>

                  <div>
                    <label className="block text-sm font-bold text-white/90 mb-2.5">Description</label>
                    <textarea
                      value={experience.description}
                      onChange={(e) => updateExperience(experience.id, "description", e.target.value)}
                      rows={4}
                      placeholder="Describe your responsibilities and achievements..."
                      className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] resize-y"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={addExperience}
          className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm font-bold opacity-80 transition hover:bg-white/10 w-fit"
        >
          <Building2 size={16} />
          Add Another Job
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-4 text-xs opacity-60 flex items-center gap-3">
        {saveState === "saving" && "Saving experience..."}
        {saveState === "saved" && <span className="text-emerald-400 font-bold">Experience saved.</span>}
        {saveState === "error" && <span className="text-red-400">There was a problem saving experience. Check the console.</span>}
        {saveState === "idle" && "Experience saves automatically when company and title are filled in."}
      </div>
    </div>
  );
}
