"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  return (
    experience.company.trim().length > 0 && experience.title.trim().length > 0
  );
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
  const [experiences, setExperiences] = useState<ExperienceItem[]>([
    createEmptyExperience(),
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

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

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.error("Experience auth load error:", userError);
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
        .select(
          `
            id,
            profile_id,
            title,
            company,
            employment_type,
            location,
            start_date,
            end_date,
            is_current,
            description,
            created_at,
            updated_at
          `,
        )
        .eq("profile_id", uid)
        .order("is_current", { ascending: false })
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Load experiences error:", error);
        setExperiences([createEmptyExperience()]);
        setIsLoading(false);
        hasInitializedRef.current = true;
        return;
      }

      const rows = (data ?? []) as ProfileExperienceRow[];

      if (rows.length > 0) {
        setExperiences(rows.map(mapRowToExperience));
      } else {
        setExperiences([createEmptyExperience()]);
      }

      setIsLoading(false);
      hasInitializedRef.current = true;
    }

    loadExperiences();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasInitializedRef.current) return;
    if (!profileId) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaveState("saving");

      const rowsToSave = persistableExperiences.map((experience) => ({
        profile_id: profileId,
        title: experience.title.trim(),
        company: experience.company.trim(),
        employment_type: null,
        location: experience.location.trim() || null,
        start_date: toDbDateFromYear(experience.startDate),
        end_date: experience.isCurrent
          ? null
          : toDbDateFromYear(experience.endDate),
        is_current: experience.isCurrent,
        description: experience.description.trim() || null,
      }));

      const { error: deleteError } = await supabase
        .from("profile_experiences")
        .delete()
        .eq("profile_id", profileId);

      if (deleteError) {
        console.error("Delete experiences error:", deleteError);
        setSaveState("error");
        return;
      }

      if (rowsToSave.length > 0) {
        const { error: insertError } = await supabase
          .from("profile_experiences")
          .insert(rowsToSave);

        if (insertError) {
          console.error("Insert experiences error:", insertError);
          setSaveState("error");
          return;
        }
      }

      setSaveState("saved");

      window.setTimeout(() => {
        setSaveState((prev) => (prev === "saved" ? "idle" : prev));
      }, 1200);
    }, 700);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [experiences, persistableExperiences, profileId]);

  function updateExperience(
    id: string,
    field: keyof ExperienceItem,
    value: string | boolean,
  ) {
    setExperiences((prev) =>
      prev.map((experience) => {
        if (experience.id !== id) return experience;

        if (field === "isCurrent") {
          const isCurrent = Boolean(value);

          return {
            ...experience,
            isCurrent,
            endDate: isCurrent ? "" : experience.endDate,
          };
        }

        return {
          ...experience,
          [field]: value,
        };
      }),
    );
  }

  function addExperience() {
    setExperiences((prev) => [...prev, createEmptyExperience()]);
  }

  function removeExperience(id: string) {
    setExperiences((prev) => {
      if (prev.length === 1) {
        return [createEmptyExperience()];
      }

      return prev.filter((experience) => experience.id !== id);
    });
  }

  return (
    <div className="grid gap-4">
      {isLoading ? (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px dashed #555",
            opacity: 0.85,
            fontSize: 14,
          }}
        >
          Loading experience...
        </div>
      ) : null}

      {experiences.map((experience, index) => (
        <div
          key={experience.id}
          className="rounded-xl border border-[#555] p-4 grid gap-3.5 bg-[rgba(255,255,255,0.02)]"
        >
          <div className="flex justify-between items-center gap-3">
            <h4 className="m-0 text-base font-semibold">Job #{index + 1}</h4>

            <button
              type="button"
              onClick={() => removeExperience(experience.id)}
              className="wac-button-chip"
            >
              Remove
            </button>
          </div>

          <div>
            <label>Company</label>
            <br />
            <input
              value={experience.company}
              onChange={(e) =>
                updateExperience(experience.id, "company", e.target.value)
              }
              className="w-full p-2.5 mt-1.5"
            />
          </div>

          <div>
            <label>Title</label>
            <br />
            <input
              value={experience.title}
              onChange={(e) =>
                updateExperience(experience.id, "title", e.target.value)
              }
              className="w-full p-2.5 mt-1.5"
            />
          </div>

          <div>
            <label>Industry Tag</label>
            <br />
            <input
              value={experience.industryTag}
              onChange={(e) =>
                updateExperience(experience.id, "industryTag", e.target.value)
              }
              className="w-full p-2.5 mt-1.5"
            />
          </div>

          <div>
            <label>Website</label>
            <br />
            <input
              type="url"
              value={experience.website}
              onChange={(e) =>
                updateExperience(experience.id, "website", e.target.value)
              }
              className="w-full p-2.5 mt-1.5"
            />
          </div>

          <div>
            <label>Location</label>
            <br />
            <input
              value={experience.location}
              onChange={(e) =>
                updateExperience(experience.id, "location", e.target.value)
              }
              placeholder="New Jersey"
              style={{ width: "100%", padding: 10, marginTop: 6 }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div>
              <label>Start Year</label>
              <br />
              <input
                type="number"
                min="1950"
                max="2100"
                inputMode="numeric"
                value={experience.startDate}
                onChange={(e) =>
                  updateExperience(
                    experience.id,
                    "startDate",
                    e.target.value.replace(/[^\d]/g, "").slice(0, 4),
                  )
                }
                className="w-full p-2.5 mt-1.5"
              />
            </div>

            <div>
              <label>End Year</label>
              <br />
              <input
                type="number"
                min="1950"
                max="2100"
                inputMode="numeric"
                value={experience.endDate}
                onChange={(e) =>
                  updateExperience(
                    experience.id,
                    "endDate",
                    e.target.value.replace(/[^\d]/g, "").slice(0, 4),
                  )
                }
                disabled={experience.isCurrent}
                className={`w-full p-2.5 mt-1.5 ${experience.isCurrent ? "opacity-60" : "opacity-100"}`}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={experience.isCurrent}
              onChange={(e) =>
                updateExperience(experience.id, "isCurrent", e.target.checked)
              }
            />
            I currently work here
          </label>

          <div>
            <label>Description</label>
            <br />
            <textarea
              value={experience.description}
              onChange={(e) =>
                updateExperience(experience.id, "description", e.target.value)
              }
              rows={5}
              className="w-full p-2.5 mt-1.5"
            />
          </div>
        </div>
      ))}

      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          onClick={addExperience}
          className="wac-button-chip"
        >
          Add Another Job
        </button>
      </div>

      <div className="p-3 rounded-xl dashed-border border-[#555] opacity-85 text-sm">
        {saveState === "saving" && "Saving experience..."}
        {saveState === "saved" && "Experience saved."}
        {saveState === "error" &&
          "There was a problem saving experience. Check the console and table policies."}
        {saveState === "idle" &&
          "Experience saves automatically when company and title are filled in."}
      </div>
    </div>
  );
}
