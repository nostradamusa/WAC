"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProfileCareerSection from "@/components/profile/ProfileCareerSection";
import ProfileCompletionCard from "@/components/profile/ProfileCompletionCard";
import ProfileExperienceSection from "@/components/profile/ProfileExperienceSection";
import ProfileLocationSection from "@/components/profile/ProfileLocationSection";
import ProfileSectionCard from "@/components/profile/ProfileSectionCard";
import ProfileSkillsSection from "@/components/profile/ProfileSkillsSection";
import ManagedEntitiesTab from "@/components/profile/ManagedEntitiesTab";

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

type Skill = {
  id: string;
  name: string;
  category: string | null;
};

type ExperienceRow = {
  id: string;
};

type CurrentExperienceRow = {
  id: string;
  company: string;
  title: string;
  is_current: boolean;
  start_date: string | null;
};

type ProfileFieldTarget =
  | "fullName"
  | "username"
  | "headline"
  | "industryId"
  | "professionId"
  | "specialtyId"
  | "country"
  | "stateRegion"
  | "city"
  | "ancestryCity"
  | "bio"
  | "skills"
  | "experience";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<
    "personal" | "entities" | "settings"
  >("personal");
  const [userId, setUserId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [headline, setHeadline] = useState("");
  const [professionId, setProfessionId] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");
  const [ancestryCity, setAncestryCity] = useState("");
  const [bio, setBio] = useState("");
  const [industryId, setIndustryId] = useState("");

  const [openToWork, setOpenToWork] = useState(false);
  const [openToHire, setOpenToHire] = useState(false);
  const [openToMentor, setOpenToMentor] = useState(false);
  const [openToInvest, setOpenToInvest] = useState(false);
  const [openToCollaborate, setOpenToCollaborate] = useState(false);

  const [industries, setIndustries] = useState<Industry[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [hasExperience, setHasExperience] = useState(false);
  const [message, setMessage] = useState("");

  const [currentCompany, setCurrentCompany] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");

  const [highlightedTarget, setHighlightedTarget] =
    useState<ProfileFieldTarget | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        setMessage("You must be signed in.");
        return;
      }

      const uid = userData.user.id;
      setUserId(uid);

      const [
        industriesRes,
        professionsRes,
        specialtiesRes,
        skillsRes,
        profileRes,
        profileSkillsRes,
        experienceRes,
        currentExperienceRes,
      ] = await Promise.all([
        supabase
          .from("industries")
          .select("id, name")
          .order("name", { ascending: true }),
        supabase
          .from("professions")
          .select("id, name, industry_id")
          .order("name", { ascending: true }),
        supabase
          .from("specialties")
          .select("id, name, industry_id")
          .order("name", { ascending: true }),
        supabase
          .from("skills")
          .select("id, name, category")
          .order("category", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("profiles")
          .select(
            `
            full_name,
            username,
            headline,
            country,
            state,
            city,
            ancestry_city,
            bio,
            industry_id,
            profession_id,
            specialty_id,
            open_to_work,
            open_to_hire,
            open_to_mentor,
            open_to_invest,
            open_to_collaborate
          `,
          )
          .eq("id", uid)
          .single(),
        supabase
          .from("profile_skills")
          .select("skill_id")
          .eq("profile_id", uid),
        supabase
          .from("profile_experiences")
          .select("id")
          .eq("profile_id", uid)
          .limit(1),
        supabase
          .from("profile_experiences")
          .select("id, company, title, is_current, start_date")
          .eq("profile_id", uid)
          .order("is_current", { ascending: false })
          .order("start_date", { ascending: false })
          .limit(1),
      ]);

      if (!industriesRes.error) setIndustries(industriesRes.data ?? []);
      else console.error("Industries load error:", industriesRes.error);

      if (!professionsRes.error) setProfessions(professionsRes.data ?? []);
      else console.error("Professions load error:", professionsRes.error);

      if (!specialtiesRes.error) setSpecialties(specialtiesRes.data ?? []);
      else console.error("Specialties load error:", specialtiesRes.error);

      if (!skillsRes.error) setSkills(skillsRes.data ?? []);
      else console.error("Skills load error:", skillsRes.error);

      if (profileRes.error || !profileRes.data) {
        console.error("Profile load error:", profileRes.error);
        setMessage("Could not load profile.");
        return;
      }

      const profile = profileRes.data;

      setFullName(profile.full_name ?? "");
      setUsername(profile.username ?? "");
      setHeadline(profile.headline ?? "");
      setCountry(profile.country ?? "");
      setStateRegion(profile.state ?? "");
      setCity(profile.city ?? "");
      setAncestryCity(profile.ancestry_city ?? "");
      setBio(profile.bio ?? "");
      setIndustryId(profile.industry_id ?? "");
      setProfessionId(profile.profession_id ?? "");
      setSpecialtyId(profile.specialty_id ?? "");

      setOpenToWork(profile.open_to_work ?? false);
      setOpenToHire(profile.open_to_hire ?? false);
      setOpenToMentor(profile.open_to_mentor ?? false);
      setOpenToInvest(profile.open_to_invest ?? false);
      setOpenToCollaborate(profile.open_to_collaborate ?? false);

      if (!profileSkillsRes.error) {
        setSelectedSkillIds(
          (profileSkillsRes.data ?? []).map((row) => row.skill_id),
        );
      } else {
        console.error("Profile skills load error:", profileSkillsRes.error);
      }

      if (!experienceRes.error) {
        const experiences = (experienceRes.data ?? []) as ExperienceRow[];
        setHasExperience(experiences.length > 0);
      } else {
        console.error("Profile experiences load error:", experienceRes.error);
      }

      if (!currentExperienceRes.error) {
        const rows = (currentExperienceRes.data ??
          []) as CurrentExperienceRow[];
        const current = rows[0];

        setCurrentCompany(current?.company ?? "");
        setCurrentTitle(current?.title ?? "");
      } else {
        console.error(
          "Current experience load error:",
          currentExperienceRes.error,
        );
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    if (!highlightedTarget) return;

    const timeout = window.setTimeout(() => {
      setHighlightedTarget(null);
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [highlightedTarget]);

  const selectedIndustryName = useMemo(() => {
    return (
      industries.find((industry) => industry.id === industryId)?.name ?? ""
    );
  }, [industries, industryId]);

  const filteredProfessions = useMemo(() => {
    if (!industryId) return [];
    return professions.filter(
      (profession) => profession.industry_id === industryId,
    );
  }, [professions, industryId]);

  const filteredSpecialties = useMemo(() => {
    if (!industryId) return [];
    if (selectedIndustryName !== "Healthcare") return [];
    return specialties.filter(
      (specialty) => specialty.industry_id === industryId,
    );
  }, [specialties, industryId, selectedIndustryName]);

  const selectedProfessionName = useMemo(() => {
    return (
      filteredProfessions.find((profession) => profession.id === professionId)
        ?.name ?? ""
    );
  }, [filteredProfessions, professionId]);

  const filteredSkills = useMemo(() => {
    if (!selectedIndustryName) return [];

    if (selectedIndustryName !== "Healthcare") {
      return skills.filter((skill) => skill.category === selectedIndustryName);
    }

    if (!selectedProfessionName) return [];

    if (selectedProfessionName === "Physician") {
      return skills.filter((skill) =>
        ["Patient Care", "Case Management", "Clinical Education"].includes(
          skill.name,
        ),
      );
    }

    if (selectedProfessionName === "NP / PA") {
      return skills.filter((skill) =>
        ["Patient Care", "Case Management", "Clinical Education"].includes(
          skill.name,
        ),
      );
    }

    if (selectedProfessionName === "Nurse") {
      return skills.filter((skill) =>
        [
          "Nursing",
          "Patient Care",
          "Case Management",
          "Clinical Education",
        ].includes(skill.name),
      );
    }

    if (selectedProfessionName === "Medical Assistant") {
      return skills.filter((skill) =>
        ["Patient Care", "Clinical Education"].includes(skill.name),
      );
    }

    if (selectedProfessionName === "Pharmacist") {
      return skills.filter((skill) =>
        ["Pharmacy", "Clinical Education"].includes(skill.name),
      );
    }

    if (selectedProfessionName === "Pharmaceutical Sales Representative") {
      return skills.filter((skill) =>
        [
          "Pharmaceutical Sales",
          "HCP Engagement",
          "Territory Management",
          "Account Planning",
          "Sales Strategy",
        ].includes(skill.name),
      );
    }

    if (selectedProfessionName === "Medical Device Sales Representative") {
      return skills.filter((skill) =>
        [
          "Sales",
          "Business Development",
          "Account Management",
          "Client Retention",
        ].includes(skill.name),
      );
    }

    return skills.filter((skill) => skill.category === selectedIndustryName);
  }, [skills, selectedIndustryName, selectedProfessionName]);

  function handleIndustryChange(newIndustryId: string) {
    setIndustryId(newIndustryId);
    setProfessionId("");
    setSpecialtyId("");
    setSelectedSkillIds([]);
  }

  function handleProfessionChange(newProfessionId: string) {
    setProfessionId(newProfessionId);
    setSpecialtyId("");
    setSelectedSkillIds([]);
  }

  function getTargetElement(target: ProfileFieldTarget): HTMLElement | null {
    const targetMap: Record<ProfileFieldTarget, string> = {
      fullName: "profile-field-fullName",
      username: "profile-field-username",
      headline: "profile-field-headline",
      industryId: "profile-field-industryId",
      professionId: "profile-field-professionId",
      specialtyId: "profile-field-specialtyId",
      country: "profile-field-country",
      stateRegion: "profile-field-stateRegion",
      city: "profile-field-city",
      ancestryCity: "profile-field-ancestryCity",
      bio: "profile-field-bio",
      skills: "profile-field-skills",
      experience: "profile-field-experience",
    };

    return document.getElementById(targetMap[target]);
  }

  function focusElement(targetElement: HTMLElement | null) {
    if (!targetElement) return;

    const focusable = targetElement.matches("input, textarea, select, button")
      ? (targetElement as HTMLElement)
      : (targetElement.querySelector(
          "input, textarea, select, button",
        ) as HTMLElement | null);

    focusable?.focus();
  }

  function handleJumpToField(target: ProfileFieldTarget) {
    const element = getTargetElement(target);
    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    window.setTimeout(() => {
      focusElement(element);
    }, 250);

    setHighlightedTarget(target);
  }

  function getWrapperStyle(targets: ProfileFieldTarget[]) {
    const isHighlighted = highlightedTarget
      ? targets.includes(highlightedTarget)
      : false;

    return {
      scrollMarginTop: 100,
      borderRadius: 12,
      padding: isHighlighted ? 10 : 0,
      margin: isHighlighted ? "-10px" : "0",
      transition:
        "box-shadow 0.25s ease, background-color 0.25s ease, padding 0.25s ease, margin 0.25s ease",
      boxShadow: isHighlighted ? "0 0 0 2px rgba(212, 175, 55, 0.9)" : "none",
      background: isHighlighted ? "rgba(212, 175, 55, 0.08)" : "transparent",
    } as const;
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();

    if (!userId) {
      setMessage("No signed-in user found.");
      return;
    }

    setMessage("Saving...");

    const cleanedUsername = username.trim().toLowerCase();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        username: cleanedUsername || null,
        headline,
        country,
        state: stateRegion,
        city,
        ancestry_city: ancestryCity,
        bio,
        industry_id: industryId || null,
        profession_id: professionId || null,
        specialty_id: specialtyId || null,
        profession: selectedProfessionName || null,
        open_to_work: openToWork,
        open_to_hire: openToHire,
        open_to_mentor: openToMentor,
        open_to_invest: openToInvest,
        open_to_collaborate: openToCollaborate,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Save error:", profileError);
      setMessage(`Failed to save profile: ${profileError.message}`);
      return;
    }

    const { error: deleteError } = await supabase
      .from("profile_skills")
      .delete()
      .eq("profile_id", userId);

    if (deleteError) {
      console.error("Delete profile skills error:", deleteError);
      setMessage(
        `Profile saved, but skills failed to reset: ${deleteError.message}`,
      );
      return;
    }

    if (selectedSkillIds.length > 0) {
      const rows = selectedSkillIds.map((skillId) => ({
        profile_id: userId,
        skill_id: skillId,
      }));

      const { error: insertError } = await supabase
        .from("profile_skills")
        .insert(rows);

      if (insertError) {
        console.error("Insert profile skills error:", insertError);
        setMessage(
          `Profile saved, but skills failed to save: ${insertError.message}`,
        );
        return;
      }
    }

    const { data: refreshedExperienceData, error: refreshedExperienceError } =
      await supabase
        .from("profile_experiences")
        .select("id, company, title, is_current, start_date")
        .eq("profile_id", userId)
        .order("is_current", { ascending: false })
        .order("start_date", { ascending: false })
        .limit(1);

    if (!refreshedExperienceError) {
      const experiences = (refreshedExperienceData ??
        []) as CurrentExperienceRow[];
      setHasExperience(experiences.length > 0);
      setCurrentCompany(experiences[0]?.company ?? "");
      setCurrentTitle(experiences[0]?.title ?? "");
    } else {
      console.error(
        "Refresh profile experiences error:",
        refreshedExperienceError,
      );
    }

    setMessage("Profile saved successfully.");
  }

  return (
    <div style={{ padding: 40, maxWidth: 1200, margin: "0 auto" }}>
      <h1 className="text-4xl font-serif tracking-tight mb-2 text-white">
        <span className="text-[#D4AF37] italic font-light opacity-90">
          Your
        </span>{" "}
        Profile
      </h1>
      <p className="opacity-70 mb-8">
        Complete your World Albanian Congress profile.
      </p>

      <div className="flex border-b border-[var(--border)] mb-10 w-full overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("personal")}
          className={`pb-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "personal"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent opacity-60 hover:opacity-100"
          }`}
        >
          Personal Profile
        </button>
        <button
          onClick={() => setActiveTab("entities")}
          className={`pb-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "entities"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent opacity-60 hover:opacity-100"
          }`}
        >
          Managed Entities
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "settings"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-transparent opacity-60 hover:opacity-100"
          }`}
        >
          Account Settings
        </button>
      </div>

      {activeTab === "personal" && (
        <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          <form onSubmit={handleSave} className="grid gap-5">
            <div style={getWrapperStyle(["fullName", "username", "bio"])}>
              <ProfileSectionCard
                title="Profile"
                description="Basic public information"
              >
                <div className="grid gap-4">
                  <div id="profile-field-fullName">
                    <label htmlFor="fullName">Full Name</label>
                    <br />
                    <input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2.5 mt-1.5"
                    />
                  </div>

                  <div id="profile-field-username">
                    <label htmlFor="username">Username</label>
                    <br />
                    <input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="yourpublicname"
                      className="w-full p-2.5 mt-1.5"
                    />
                  </div>

                  <div id="profile-field-bio">
                    <label htmlFor="bio">Bio</label>
                    <br />
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={5}
                      className="w-full p-2.5 mt-1.5"
                    />
                  </div>

                  {(currentCompany || currentTitle) && (
                    <div className="p-3 rounded-xl border border-[rgba(176,141,87,0.25)] bg-[rgba(176,141,87,0.06)] grid gap-1.5">
                      <div className="text-xs opacity-70 tracking-wider font-semibold uppercase">
                        CURRENT ROLE
                      </div>
                      {currentTitle ? (
                        <div className="text-base font-semibold">
                          {currentTitle}
                        </div>
                      ) : null}
                      {currentCompany ? (
                        <div className="opacity-90">{currentCompany}</div>
                      ) : null}
                    </div>
                  )}
                </div>
              </ProfileSectionCard>
            </div>

            <div
              style={getWrapperStyle([
                "headline",
                "industryId",
                "professionId",
                "specialtyId",
              ])}
            >
              <div id="profile-field-headline">
                <div id="profile-field-industryId">
                  <div id="profile-field-professionId">
                    <div id="profile-field-specialtyId">
                      <ProfileSectionCard
                        title="Profession"
                        description="Your professional path and focus"
                      >
                        <ProfileCareerSection
                          headline={headline}
                          setHeadline={setHeadline}
                          industryId={industryId}
                          handleIndustryChange={handleIndustryChange}
                          industries={industries}
                          professionId={professionId}
                          handleProfessionChange={handleProfessionChange}
                          filteredProfessions={filteredProfessions}
                          selectedIndustryName={selectedIndustryName}
                          specialtyId={specialtyId}
                          setSpecialtyId={setSpecialtyId}
                          filteredSpecialties={filteredSpecialties}
                        />
                      </ProfileSectionCard>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={getWrapperStyle(["skills"])}>
              <div id="profile-field-skills">
                <ProfileSectionCard
                  title="Skills & Expertise"
                  description="What you know and do well"
                >
                  <ProfileSkillsSection
                    industryId={industryId}
                    professionId={professionId}
                    filteredSkills={filteredSkills}
                    allSkills={skills}
                    selectedSkillIds={selectedSkillIds}
                    setSelectedSkillIds={setSelectedSkillIds}
                  />
                </ProfileSectionCard>
              </div>
            </div>

            <div style={getWrapperStyle(["experience"])}>
              <div id="profile-field-experience">
                <ProfileSectionCard
                  title="Experience"
                  description="Your professional track record"
                >
                  <div className="mb-3 p-3 rounded-xl border border-dashed border-[#555] opacity-85 text-sm">
                    Your current company and title are derived automatically
                    from your active experience entry.
                  </div>

                  <ProfileExperienceSection
                    onHasExperienceChange={setHasExperience}
                  />
                </ProfileSectionCard>
              </div>
            </div>

            <div
              style={getWrapperStyle([
                "country",
                "stateRegion",
                "city",
                "ancestryCity",
              ])}
            >
              <div id="profile-field-country">
                <div id="profile-field-stateRegion">
                  <div id="profile-field-city">
                    <div id="profile-field-ancestryCity">
                      <ProfileSectionCard
                        title="Location & Roots"
                        description="Where you are and where your roots are"
                      >
                        <ProfileLocationSection
                          country={country}
                          setCountry={setCountry}
                          stateRegion={stateRegion}
                          setStateRegion={setStateRegion}
                          city={city}
                          setCity={setCity}
                          ancestryCity={ancestryCity}
                          setAncestryCity={setAncestryCity}
                        />
                      </ProfileSectionCard>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ProfileSectionCard
              title="Network Intent"
              description="How others can connect with you"
            >
              <div style={{ display: "grid", gap: 10 }}>
                <label>
                  <input
                    type="checkbox"
                    checked={openToWork}
                    onChange={(e) => setOpenToWork(e.target.checked)}
                  />{" "}
                  Work
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={openToHire}
                    onChange={(e) => setOpenToHire(e.target.checked)}
                  />{" "}
                  Hiring
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={openToMentor}
                    onChange={(e) => setOpenToMentor(e.target.checked)}
                  />{" "}
                  Mentoring
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={openToInvest}
                    onChange={(e) => setOpenToInvest(e.target.checked)}
                  />{" "}
                  Investing
                </label>

                <label>
                  <input
                    type="checkbox"
                    checked={openToCollaborate}
                    onChange={(e) => setOpenToCollaborate(e.target.checked)}
                  />{" "}
                  Collaborating
                </label>
              </div>
            </ProfileSectionCard>

            <button
              type="submit"
              style={{
                padding: "12px 20px",
                fontSize: "16px",
                cursor: "pointer",
                width: 180,
              }}
            >
              Save Profile
            </button>

            {message && <p style={{ marginTop: 4 }}>{message}</p>}
          </form>

          <aside
            style={{
              position: "sticky",
              top: 24,
              alignSelf: "start",
            }}
          >
            <ProfileCompletionCard
              fullName={fullName}
              username={username}
              headline={headline}
              industryId={industryId}
              professionId={professionId}
              specialtyId={specialtyId}
              country={country}
              stateRegion={stateRegion}
              city={city}
              ancestryCity={ancestryCity}
              bio={bio}
              selectedSkillIds={selectedSkillIds}
              hasExperience={hasExperience}
              onJumpToField={handleJumpToField}
            />
          </aside>
        </div>
      )}

      {activeTab === "entities" && userId && (
        <ManagedEntitiesTab userId={userId} />
      )}

      {activeTab === "settings" && userId && (
        <div className="max-w-2xl mx-auto space-y-6 pt-8">
           <ProfileSectionCard title="Calendar Preferences" description="Manage how events from organizations you follow appear on your personal calendar.">
              <div className="flex items-start justify-between gap-6 p-4 rounded-xl border border-white/10 bg-black/20">
                 <div>
                    <h4 className="font-bold text-[var(--accent)] mb-1">Auto-Sync Followed Events</h4>
                    <p className="text-sm opacity-70 leading-relaxed">When you follow an organization, automatically push their events to your "My Calendar" feed so you never miss an update.</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                 </label>
              </div>
           </ProfileSectionCard>

           <div className="opacity-40 text-center py-12 text-sm mt-8 border-t border-white/5">
             More account settings (email, notifications, privacy) coming soon.
           </div>
        </div>
      )}
    </div>
  );
}
