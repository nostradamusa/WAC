"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProfileCareerSection from "@/components/profile/ProfileCareerSection";
import ProfileCompletionCard, { ProfileFieldTarget } from "@/components/profile/ProfileCompletionCard";
import ProfileExperienceSection from "@/components/profile/ProfileExperienceSection";
import ProfileSkillsSection from "@/components/profile/ProfileSkillsSection";
import ProfileCard from "@/components/profile/ProfileCard";
import ManagedEntitiesTab from "@/components/profile/ManagedEntitiesTab";
import WacSelect from "@/components/ui/WacSelect";
import Link from "next/link";
import { MapPin, Briefcase, Calendar, Shield, Save, CheckCircle, ExternalLink, User, UserCircle, Target, Award, Activity } from "lucide-react";
import { useScrollDirection } from "@/lib/hooks/useScrollDirection";

type Industry = { id: string; name: string };
type Profession = { id: string; name: string; industry_id: string };
type Specialty = { id: string; name: string; industry_id: string };
type Skill = { id: string; name: string; category: string | null };
type ExperienceRow = { id: string };
type CurrentExperienceRow = {
  id: string;
  company: string;
  title: string;
  is_current: boolean;
  start_date: string | null;
};



export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"personal" | "entities" | "settings">("personal");
  const scrollDirection = useScrollDirection();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Identity Form State
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [headline, setHeadline] = useState("");
  const [tagline, setTagline] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Career Form State
  const [professionId, setProfessionId] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  // Location & Map State
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");
  const [ancestryCity, setAncestryCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [mapVisibility, setMapVisibility] = useState("approximate");

  // Personal Details & Life Stage
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [birthdayVisibility, setBirthdayVisibility] = useState("month_day");

  // Network Intent
  const [openToWork, setOpenToWork] = useState(false);
  const [openToHire, setOpenToHire] = useState(false);
  const [openToMentor, setOpenToMentor] = useState(false);
  const [openToInvest, setOpenToInvest] = useState(false);
  const [openToCollaborate, setOpenToCollaborate] = useState(false);

  // References
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [hasExperience, setHasExperience] = useState(false);

  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [currentCompany, setCurrentCompany] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");

  const [highlightedTarget, setHighlightedTarget] = useState<ProfileFieldTarget | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const { data: userData, error: userError } = await supabase.auth.getUser();

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
        supabase.from("industries").select("id, name").order("name", { ascending: true }),
        supabase.from("professions").select("id, name, industry_id").order("name", { ascending: true }),
        supabase.from("specialties").select("id, name, industry_id").order("name", { ascending: true }),
        supabase.from("skills").select("id, name, category").order("category", { ascending: true }).order("name", { ascending: true }),
        supabase
          .from("profiles")
          .select(`
            full_name, username, headline, tagline, avatar_url, country, state, city, ancestry_city,
            street_address, address_line_2, zip_code, map_visibility, date_of_birth, gender, birthday_visibility,
            bio, industry_id, profession_id, specialty_id, open_to_work, open_to_hire, open_to_mentor, open_to_invest, open_to_collaborate
          `)
          .eq("id", uid)
          .single(),
        supabase.from("profile_skills").select("skill_id").eq("profile_id", uid),
        supabase.from("profile_experiences").select("id").eq("profile_id", uid).limit(1),
        supabase
          .from("profile_experiences")
          .select("id, company, title, is_current, start_date")
          .eq("profile_id", uid)
          .order("is_current", { ascending: false })
          .order("start_date", { ascending: false })
          .limit(1),
      ]);

      if (!industriesRes.error) setIndustries(industriesRes.data ?? []);
      if (!professionsRes.error) setProfessions(professionsRes.data ?? []);
      if (!specialtiesRes.error) setSpecialties(specialtiesRes.data ?? []);
      if (!skillsRes.error) setSkills(skillsRes.data ?? []);

      if (profileRes.data) {
        const p = profileRes.data;
        setFullName(p.full_name ?? "");
        setUsername(p.username ?? "");
        setHeadline(p.headline ?? "");
        setTagline(p.tagline ?? "");
        setAvatarUrl(p.avatar_url ?? "");
        
        setCountry(p.country ?? "");
        setStateRegion(p.state ?? "");
        setCity(p.city ?? "");
        setAncestryCity(p.ancestry_city ?? "");
        setStreetAddress(p.street_address ?? "");
        setAddressLine2(p.address_line_2 ?? "");
        setZipCode(p.zip_code ?? "");
        setMapVisibility(p.map_visibility ?? "approximate");

        setDateOfBirth(p.date_of_birth ?? "");
        setGender(p.gender ?? "");
        setBirthdayVisibility(p.birthday_visibility ?? "month_day");

        setBio(p.bio ?? "");
        setIndustryId(p.industry_id ?? "");
        setProfessionId(p.profession_id ?? "");
        setSpecialtyId(p.specialty_id ?? "");

        setOpenToWork(p.open_to_work ?? false);
        setOpenToHire(p.open_to_hire ?? false);
        setOpenToMentor(p.open_to_mentor ?? false);
        setOpenToInvest(p.open_to_invest ?? false);
        setOpenToCollaborate(p.open_to_collaborate ?? false);
      }

      if (!profileSkillsRes.error) setSelectedSkillIds((profileSkillsRes.data ?? []).map((r) => r.skill_id));
      
      if (!experienceRes.error) setHasExperience(((experienceRes.data ?? []) as ExperienceRow[]).length > 0);

      if (!currentExperienceRes.error) {
        const rows = (currentExperienceRes.data ?? []) as CurrentExperienceRow[];
        const current = rows[0];
        setCurrentCompany(current?.company ?? "");
        setCurrentTitle(current?.title ?? "");
      }
      // Flag as loaded to allow auto-save hook to start tracking changes
      setIsLoaded(true);
    }

    loadProfile();
  }, []);

  useEffect(() => {
    if (!highlightedTarget) return;
    const timeout = window.setTimeout(() => setHighlightedTarget(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [highlightedTarget]);

  // Derived Values
  const selectedIndustryName = useMemo(() => industries.find((i) => i.id === industryId)?.name ?? "", [industries, industryId]);
  const filteredProfessions = useMemo(() => professions.filter((p) => p.industry_id === industryId), [professions, industryId]);
  const filteredSpecialties = useMemo(() => {
    if (selectedIndustryName !== "Healthcare") return [];
    return specialties.filter((s) => s.industry_id === industryId);
  }, [specialties, industryId, selectedIndustryName]);

  const selectedProfessionName = useMemo(() => filteredProfessions.find((p) => p.id === professionId)?.name ?? "", [filteredProfessions, professionId]);

  const filteredSkills = useMemo(() => {
    if (!selectedIndustryName) return [];
    if (selectedIndustryName !== "Healthcare") return skills.filter((s) => s.category === selectedIndustryName);
    return skills.filter((skill) => skill.category === selectedIndustryName); // Assuming full filtering logic retained in ProfileSkillsSection
  }, [skills, selectedIndustryName]);

  function handleIndustryChange(newId: string) { setIndustryId(newId); setProfessionId(""); setSpecialtyId(""); setSelectedSkillIds([]); }
  function handleProfessionChange(newId: string) { setProfessionId(newId); setSpecialtyId(""); setSelectedSkillIds([]); }

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
      streetAddress: "profile-field-streetAddress",
      addressLine2: "profile-field-addressLine2",
      zipCode: "profile-field-zipCode",
      mapVisibility: "profile-field-mapVisibility",
      bio: "profile-field-bio",
      skills: "profile-field-skills",
      experience: "profile-field-experience",
      personalDetails: "profile-field-personalDetails",
      tagline: "profile-field-tagline",
      dateOfBirth: "profile-field-dateOfBirth",
      gender: "profile-field-gender",
      birthdayVisibility: "profile-field-birthdayVisibility",
    };

    return document.getElementById(targetMap[target]);
  }

  function focusElement(targetElement: HTMLElement | null) {
    if (!targetElement) return;

    const focusable = targetElement.matches("input, textarea, select, button")
      ? (targetElement as HTMLElement)
      : (targetElement.querySelector(
          "input, textarea, select, button"
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

  const getWrapperStyle = (targets: ProfileFieldTarget[]) => {
    const isHighlighted = highlightedTarget ? targets.includes(highlightedTarget) : false;
    return {
      scrollMarginTop: 100, borderRadius: 12, padding: isHighlighted ? 10 : 0, margin: isHighlighted ? "-10px" : "0",
      transition: "box-shadow 0.25s ease, background-color 0.25s ease, padding 0.25s ease, margin 0.25s ease",
      boxShadow: isHighlighted ? "0 0 0 2px rgba(176, 141, 87, 0.9)" : "none", background: isHighlighted ? "rgba(176, 141, 87, 0.08)" : "transparent",
    } as const;
  };

  async function handleSave(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!userId) { setMessage("No signed-in user found."); return; }

    setIsSaving(true);
    setMessage("");

    const cleanedUsername = username.trim().toLowerCase();

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName, username: cleanedUsername || null,
          headline, tagline,
          country, state: stateRegion, city, ancestry_city: ancestryCity,
          street_address: streetAddress, address_line_2: addressLine2, zip_code: zipCode, map_visibility: mapVisibility,
          date_of_birth: dateOfBirth || null, gender: gender || null, birthday_visibility: birthdayVisibility,
          bio, industry_id: industryId || null, profession_id: professionId || null, specialty_id: specialtyId || null,
          profession: selectedProfessionName || null,
          open_to_work: openToWork, open_to_hire: openToHire, open_to_mentor: openToMentor,
          open_to_invest: openToInvest, open_to_collaborate: openToCollaborate,
        })
        .eq("id", userId);

      if (profileError && profileError.code !== "PGRST204" && !profileError.message.includes("could not find the column")) {
        throw new Error(`Failed to save profile: ${profileError.message}`);
      }

      await supabase.from("profile_skills").delete().eq("profile_id", userId);
      if (selectedSkillIds.length > 0) {
        await supabase.from("profile_skills").insert(selectedSkillIds.map((id) => ({ profile_id: userId, skill_id: id })));
      }

      setMessage("Profile saved successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err);
        setMessage(err.message || "An error occurred while saving.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  // Auto-save logic (debounced)
  useEffect(() => {
    if (!isLoaded || !userId) return;

    const t = setTimeout(() => {
      handleSave();
    }, 1500);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
     fullName, username, headline, tagline, avatarUrl,
     country, stateRegion, city, ancestryCity, streetAddress, addressLine2, zipCode, mapVisibility,
     dateOfBirth, gender, birthdayVisibility,
     bio, industryId, professionId, specialtyId,
     openToWork, openToHire, openToMentor, openToInvest, openToCollaborate,
     selectedSkillIds, hasExperience
  ]);

  return (
    <div className="wac-page max-w-6xl mx-auto pt-16 md:pt-32 pb-32">
      <div className="flex items-start justify-between mb-6 md:mb-8 px-4 md:px-0">
         <div>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight mb-1 md:mb-2 text-white">
               <span className="text-[#b08d57] italic font-light opacity-90">Personal</span> Identity
            </h1>
            <p className="opacity-70 text-sm md:text-base">
               Manage your professional identity, local discovery presence, and network visibility.
            </p>
         </div>
      </div>

      <div className="flex justify-between sm:justify-start border-b border-[var(--border)] mb-8 md:mb-10 w-full overflow-x-auto no-scrollbar scroll-smooth px-4 md:px-0">
        <button
          onClick={() => setActiveTab("personal")}
          className={`shrink-0 pb-4 px-3 sm:px-6 text-[10px] sm:text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap text-center ${
            activeTab === "personal" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent opacity-60 hover:opacity-100"
          }`}
        >
          Personal Profile
        </button>
        <button
          onClick={() => setActiveTab("entities")}
          className={`shrink-0 pb-4 px-3 sm:px-6 text-[10px] sm:text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap text-center ${
            activeTab === "entities" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent opacity-60 hover:opacity-100"
          }`}
        >
          Managed Entities
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`shrink-0 pb-4 px-3 sm:px-6 text-[10px] sm:text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap text-center ${
            activeTab === "settings" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent opacity-60 hover:opacity-100"
          }`}
        >
          Account Settings
        </button>
      </div>

      {activeTab === "personal" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative">
           
          {/* FLOATING SAVE STATUS INDICATOR */}
          <div className={`fixed right-6 z-[100] transition-all duration-300 ease-in-out ${scrollDirection === "down" ? "bottom-6" : "bottom-[100px]"}`}>
             {isSaving ? (
                <div className="bg-[var(--accent)] text-black px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 animate-pulse">
                   <Save size={16} /> Saving...
                </div>
             ) : message ? (
                <div className="bg-emerald-500 text-white px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 transition-opacity duration-500">
                   <CheckCircle size={16} /> Saved
                </div>
             ) : null}
          </div>

          {/* LEFT COLUMN: EDIT SECTIONS */}
          <div className="lg:col-span-2 space-y-6">
            <form id="profile-form" onSubmit={handleSave} className="grid gap-8">

               {/* HEADER IDENTITY CARD */}
               <div className="wac-card p-5 md:p-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[var(--border)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

                  <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                     <div className="relative group w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--surface)] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-2xl">
                        {avatarUrl ? (
                           <img src={avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                           <User size={32} className="text-white/20" />
                        )}
                     </div>

                     <div className="flex flex-col gap-1">
                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">{fullName || "Your Name"}</h2>
                        <div className="flex flex-col text-sm opacity-80">
                           <span className="font-medium text-[#b08d57]">{headline || "Add a professional headline"}</span>
                           {currentTitle && currentCompany && (
                              <span className="flex items-center gap-1.5 opacity-70 mt-1">
                                 <Briefcase size={13} /> {currentTitle} — {currentCompany}
                              </span>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="flex w-full md:w-auto flex-col sm:flex-row items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-white/10 relative z-10 shrink-0">
                     <Link href={`/u/${username}`} target="_blank" className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
                        <ExternalLink size={16} /> Public Page
                     </Link>
                  </div>
               </div>

               {/* 1. IDENTITY & BIO */}
               <ProfileCard
                  isHighlighted={highlightedTarget ? ["fullName", "username", "bio"].includes(highlightedTarget) : false}
                  title="Profile Identity"
                  description="Tell the network who you are and how you want to be understood."
                  icon={UserCircle}
                  zIndex={20}
               >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div id="profile-field-fullName">
                           <label className="block text-sm font-bold text-white/90 mb-2.5">Full Name</label>
                           <input id="full-name" name="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]" />
                        </div>

                        <div id="profile-field-tagline">
                           <label className="block text-sm font-bold text-white/90 mb-2.5">Tagline <span className="opacity-50 font-normal">(Optional)</span></label>
                           <input id="tagline" name="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="A short, catchy phrase about what drives you" className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]" />
                        </div>
                     </div>

                     <div id="profile-field-bio">
                        <label className="block text-sm font-bold text-white/90 mb-2.5">Biography</label>
                        <textarea id="bio-textarea" name="bio-textarea" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} placeholder="Share your story, your professional journey, and your ties to the community..." className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] resize-vertical" />
                     </div>
               </ProfileCard>

               {/* 2. PROFESSION */}
               <ProfileCard
                  id="profile-field-profession-section"
                  isHighlighted={highlightedTarget ? ["headline", "industryId", "professionId", "specialtyId"].includes(highlightedTarget) : false}
                  title="Profession"
                  description="Your professional path and industry focus."
                  icon={Target}
                  zIndex={19}
               >
                  <ProfileCareerSection
                     headline={headline} setHeadline={setHeadline}
                     industryId={industryId} handleIndustryChange={handleIndustryChange} industries={industries}
                     professionId={professionId} handleProfessionChange={handleProfessionChange} filteredProfessions={filteredProfessions}
                     selectedIndustryName={selectedIndustryName} specialtyId={specialtyId} setSpecialtyId={setSpecialtyId}
                     filteredSpecialties={filteredSpecialties}
                  />
               </ProfileCard>

               {/* 3. SKILLS */}
               <ProfileCard
                  id="profile-field-skills"
                  isHighlighted={highlightedTarget ? ["skills"].includes(highlightedTarget) : false}
                  title="Skills & Expertise"
                  description="Select your top skills from your industry to rank higher in expert searches."
                  icon={Award}
                  zIndex={18}
               >
                  <ProfileSkillsSection
                     industryId={industryId} professionId={professionId} filteredSkills={filteredSkills}
                     allSkills={skills} selectedSkillIds={selectedSkillIds} setSelectedSkillIds={setSelectedSkillIds}
                  />
               </ProfileCard>

               {/* 4. EXPERIENCE */}
               <ProfileCard
                  id="profile-field-experience"
                  isHighlighted={highlightedTarget ? ["experience"].includes(highlightedTarget) : false}
                  title="Experience"
                  description="Your professional track record. (Top entry will automatically display as your current role)."
                  icon={Briefcase}
                  zIndex={17}
               >
                  <ProfileExperienceSection onHasExperienceChange={setHasExperience} />
               </ProfileCard>

               {/* 5. LOCATION, ROOTS & MAP PRESENCE */}
               <ProfileCard
                  isHighlighted={highlightedTarget ? ["country", "city"].includes(highlightedTarget) : false}
                  title="Location, Roots & Map Presence"
                  description="Help the network understand where you are, where your roots come from, and how precisely you want to appear on the global diaspora map."
                  icon={MapPin}
                  zIndex={16}
               >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div id="profile-field-country">
                              <label className="block text-sm font-bold text-white/90 mb-2.5">Country</label>
                              <input id="country" name="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. USA" className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]" />
                           </div>
                           <div id="profile-field-stateRegion">
                              <label className="block text-sm font-bold text-white/90 mb-2.5">State / Region</label>
                              <input id="state-region" name="state-region" value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} placeholder="e.g. New York" className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] focus:ring-2 focus:ring-[#b08d57]/50" />
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div id="profile-field-city">
                              <label className="block text-sm font-bold text-white/90 mb-2.5">Current City</label>
                              <input id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Manhattan" className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] focus:ring-2 focus:ring-[#b08d57]/50" />
                           </div>
                           <div id="profile-field-ancestryCity">
                              <label className="block text-sm font-bold text-white/90 mb-2.5">Ancestry City / Village</label>
                              <input id="ancestry-city" name="ancestry-city" value={ancestryCity} onChange={(e) => setAncestryCity(e.target.value)} placeholder="e.g. Struga, Prishtina" className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]" />
                           </div>
                        </div>
               </ProfileCard>

               <ProfileCard
                  title="Precise Geolocation (Private)"
                  description="Your street address helps improve proximity discovery and regional relevance, but it is never shown publicly in raw form."
                  icon={Shield}
                  zIndex={15}
               >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div id="profile-field-streetAddress" className="md:col-span-2">
                        <label className="block text-sm font-bold text-white/90 mb-2.5">Street Address <span className="opacity-50 font-normal">(Optional)</span></label>
                        <input id="street-address" name="street-address" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="e.g. 123 Main St, Apt 4B" className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]" />
                     </div>
                     <div id="profile-field-zipCode">
                        <label className="block text-sm font-bold text-white/90 mb-2.5">ZIP / Postal Code <span className="text-[#b08d57]">*</span></label>
                        <input id="zip-code" name="zip-code" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required placeholder="e.g. 10001" className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]" />
                     </div>
                  </div>

                  <div id="profile-field-mapVisibility" className="mt-6 bg-[#b08d57]/5 border border-[#b08d57]/20 p-5 rounded-xl">
                     <label className="block text-sm font-bold text-[#b08d57] mb-2 flex items-center gap-2">Diaspora Map Visibility</label>
                     <WacSelect
                        value={mapVisibility}
                        onChange={setMapVisibility}
                        options={[
                           { value: "exact", label: "City & Neighborhood Level (Recommended)" },
                           { value: "approximate", label: "State / Region Approximate Area Only" },
                           { value: "hidden", label: "Hide me from the public diaspora map" }
                        ]}
                     />
                  </div>
               </ProfileCard>

               {/* 6. PERSONAL DETAILS & LIFE STAGE */}
               <ProfileCard
                  title="Personal Details"
                  description="These details help us personalize your network experience based on life stage, maturity, and community relevance."
                  icon={Calendar}
                  zIndex={14}
               >

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div id="profile-field-dateOfBirth">
                           <label className="block text-sm font-bold text-white/90 mb-2.5">Date of Birth</label>
                           <input id="date-of-birth" name="date-of-birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm focus:border-[var(--accent)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)] [color-scheme:dark]" />
                           
                           <div id="profile-field-birthdayVisibility" className="mt-6">
                              <label className="block text-xs font-bold text-white/60 mb-2 uppercase tracking-wide">Birthday Privacy</label>
                              <WacSelect
                                 value={birthdayVisibility}
                                 onChange={setBirthdayVisibility}
                                 options={[
                                    { value: "month_day", label: "Show Month & Day only" },
                                    { value: "age", label: "Show Age only" },
                                    { value: "full", label: "Show Full Birthday" },
                                    { value: "private", label: "Keep Birthday Private" }
                                 ]}
                              />
                           </div>
                        </div>
                        <div id="profile-field-gender">
                           <label className="block text-sm font-bold text-white/90 mb-2.5">Gender</label>
                           <WacSelect
                              value={gender}
                              onChange={setGender}
                              placeholder="Select identity..."
                              options={[
                                 { value: "Male", label: "Male" },
                                 { value: "Female", label: "Female" }
                              ]}
                           />
                        </div>
                     </div>
               </ProfileCard>

               {/* 7. NETWORK INTENT */}
               <ProfileCard
                  title="Network Intent"
                  description="Let the community know how you want to interact and what opportunities you are open to."
                  icon={Activity}
                  zIndex={13}
               >
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     {[
                        { id: "openToWork", label: "Open to Work", state: openToWork, set: setOpenToWork },
                        { id: "openToHire", label: "Hiring", state: openToHire, set: setOpenToHire },
                        { id: "openToMentor", label: "Mentoring", state: openToMentor, set: setOpenToMentor },
                        { id: "openToInvest", label: "Investing", state: openToInvest, set: setOpenToInvest },
                        { id: "openToCollaborate", label: "Collaborating", state: openToCollaborate, set: setOpenToCollaborate },
                     ].map((intent) => (
                        <label key={intent.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition">
                           <div className={`w-11 h-6 shrink-0 rounded-full flex items-center p-1 transition-colors ${intent.state ? 'bg-emerald-500' : 'bg-white/20'}`}>
                              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${intent.state ? 'translate-x-5' : 'translate-x-0'}`}></div>
                           </div>
                           <span className="font-bold text-sm select-none">{intent.label}</span>
                           <input id={`intent-${intent.id}`} name={`intent-${intent.id}`} type="checkbox" checked={intent.state} onChange={(e) => intent.set(e.target.checked)} className="hidden" />
                        </label>
                     ))}
                  </div>
               </ProfileCard>

            </form>
          </div>

           {/* RIGHT COLUMN: COMPLETION & ACTION */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-[180px] hidden lg:block">
             <div className="bg-gradient-to-b from-[var(--accent)] to-[rgba(176,141,87,0.3)] p-[1px] rounded-2xl">
                <div className="bg-[#0f0f0f] rounded-2xl p-6 h-full flex flex-col pt-10 relative">
                   <div className="mt-2">
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
                        tagline={tagline}
                        streetAddress={streetAddress}
                        zipCode={zipCode}
                        dateOfBirth={dateOfBirth}
                        gender={gender}
                        selectedSkillIds={selectedSkillIds}
                        hasExperience={hasExperience}
                        onJumpToField={handleJumpToField}
                      />
                   </div>
                   
                   <div className="mt-6 pt-6 border-t border-white/10">
                      <h4 className="text-[11px] uppercase tracking-widest font-bold opacity-50 mb-4">Location Validation</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-sm">
                           <CheckCircle size={14} className={streetAddress ? "text-emerald-500 mt-0.5" : "text-white/20 mt-0.5"} />
                           <span className={streetAddress ? "opacity-100 text-white" : "opacity-60"}>Exact address saved privately</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                           <CheckCircle size={14} className={dateOfBirth ? "text-emerald-500 mt-0.5" : "text-white/20 mt-0.5"} />
                           <span className={dateOfBirth ? "opacity-100 text-white" : "opacity-60"}>Birth date added for age-relevance</span>
                        </li>
                      </ul>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === "entities" && <ManagedEntitiesTab userId={userId!} />}
      
      {activeTab === "settings" && (
        <div className="wac-card p-6 md:p-8 flex items-center justify-center text-center opacity-70 min-h-[300px]">
           Account Settings coming soon...
        </div>
      )}
    </div>
  );
}
