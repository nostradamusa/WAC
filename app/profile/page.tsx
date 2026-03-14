"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/lib/supabase";

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

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [headline, setHeadline] = useState("");
  const [company, setCompany] = useState("");
  const [professionId, setProfessionId] = useState("");
  const [specialtyId, setSpecialtyId] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");
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
  const [message, setMessage] = useState("");

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
      ] = await Promise.all([
        supabase.from("industries").select("id, name").order("name", { ascending: true }),
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
          .select(`
            full_name,
            username,
            headline,
            company,
            country,
            state,
            city,
            bio,
            industry_id,
            profession_id,
            specialty_id,
            open_to_work,
            open_to_hire,
            open_to_mentor,
            open_to_invest,
            open_to_collaborate
          `)
          .eq("id", uid)
          .single(),
        supabase
          .from("profile_skills")
          .select("skill_id")
          .eq("profile_id", uid),
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
      setCompany(profile.company ?? "");
      setCountry(profile.country ?? "");
      setStateRegion(profile.state ?? "");
      setCity(profile.city ?? "");
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
        setSelectedSkillIds((profileSkillsRes.data ?? []).map((row) => row.skill_id));
      } else {
        console.error("Profile skills load error:", profileSkillsRes.error);
      }
    }

    loadProfile();
  }, []);

  const selectedIndustryName = useMemo(() => {
    return industries.find((industry) => industry.id === industryId)?.name ?? "";
  }, [industries, industryId]);

  const filteredProfessions = useMemo(() => {
    if (!industryId) return [];
    return professions.filter((profession) => profession.industry_id === industryId);
  }, [professions, industryId]);

  const filteredSpecialties = useMemo(() => {
    if (!industryId) return [];
    if (selectedIndustryName !== "Healthcare") return [];
    return specialties.filter((specialty) => specialty.industry_id === industryId);
  }, [specialties, industryId, selectedIndustryName]);

  const selectedProfessionName = useMemo(() => {
    return filteredProfessions.find((profession) => profession.id === professionId)?.name ?? "";
  }, [filteredProfessions, professionId]);

  const filteredSkills = useMemo(() => {
    if (!selectedIndustryName) return [];

    if (selectedIndustryName !== "Healthcare") {
      return skills.filter((skill) => skill.category === selectedIndustryName);
    }

    if (!selectedProfessionName) return [];

    if (selectedProfessionName === "Physician") {
      return skills.filter((skill) =>
        ["Patient Care", "Case Management", "Clinical Education"].includes(skill.name)
      );
    }

    if (selectedProfessionName === "NP / PA") {
      return skills.filter((skill) =>
        ["Patient Care", "Case Management", "Clinical Education"].includes(skill.name)
      );
    }

    if (selectedProfessionName === "Nurse") {
      return skills.filter((skill) =>
        ["Nursing", "Patient Care", "Case Management", "Clinical Education"].includes(skill.name)
      );
    }

    if (selectedProfessionName === "Medical Assistant") {
      return skills.filter((skill) =>
        ["Patient Care", "Clinical Education"].includes(skill.name)
      );
    }

    if (selectedProfessionName === "Pharmacist") {
      return skills.filter((skill) =>
        ["Pharmacy", "Clinical Education"].includes(skill.name)
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
        ].includes(skill.name)
      );
    }

    if (selectedProfessionName === "Medical Device Sales Representative") {
      return skills.filter((skill) =>
        ["Sales", "Business Development", "Account Management", "Client Retention"].includes(
          skill.name
        )
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
        company,
        country,
        state: stateRegion,
        city,
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
      setMessage(`Profile saved, but skills failed to reset: ${deleteError.message}`);
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
        setMessage(`Profile saved, but skills failed to save: ${insertError.message}`);
        return;
      }
    }

    setMessage("Profile saved successfully.");
  }

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <h1>Edit Profile</h1>
      <p>Complete your World Albanian Congress profile.</p>

      <form onSubmit={handleSave} style={{ display: "grid", gap: 16, marginTop: 24 }}>
        <div>
          <label>Full Name</label>
          <br />
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        <div>
          <label>Username</label>
          <br />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourpublicname"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        <div>
          <label>Headline</label>
          <br />
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Founder of the World Albanian Congress / Pharmaceutical Sales Professional"
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        <div>
          <label>Industry</label>
          <br />
          <select
            value={industryId}
            onChange={(e) => handleIndustryChange(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          >
            <option value="">Select an industry</option>
            {industries.map((industry) => (
              <option key={industry.id} value={industry.id}>
                {industry.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Profession</label>
          <br />
          <select
            value={professionId}
            onChange={(e) => handleProfessionChange(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            disabled={!industryId}
          >
            <option value="">Select a profession</option>
            {filteredProfessions.map((profession) => (
              <option key={profession.id} value={profession.id}>
                {profession.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Company</label>
          <br />
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        {selectedIndustryName === "Healthcare" && (
          <div>
            <label>Specialty</label>
            <br />
            <select
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              style={{ width: "100%", padding: 10, marginTop: 6 }}
            >
              <option value="">Select a specialty</option>
              {filteredSpecialties.map((specialty) => (
                <option key={specialty.id} value={specialty.id}>
                  {specialty.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label>Skills</label>
          <br />
          {!industryId ? (
            <div
              style={{
                width: "100%",
                padding: 12,
                marginTop: 6,
                border: "1px solid #444",
                borderRadius: 8,
                opacity: 0.8,
              }}
            >
              Select an industry first.
            </div>
          ) : !professionId ? (
            <div
              style={{
                width: "100%",
                padding: 12,
                marginTop: 6,
                border: "1px solid #444",
                borderRadius: 8,
                opacity: 0.8,
              }}
            >
              Select a profession first.
            </div>
          ) : filteredSkills.length === 0 ? (
            <div
              style={{
                width: "100%",
                padding: 12,
                marginTop: 6,
                border: "1px solid #444",
                borderRadius: 8,
                opacity: 0.8,
              }}
            >
              No skills found for this profession yet.
            </div>
          ) : (
            <>
              <div style={{ marginTop: 10, marginBottom: 12 }}>
                <strong>Selected Skills:</strong>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  {selectedSkillIds.length === 0 ? (
                    <span style={{ opacity: 0.75 }}>No skills selected yet.</span>
                  ) : (
                    filteredSkills
                      .filter((skill) => selectedSkillIds.includes(skill.id))
                      .map((skill) => (
                        <span
                          key={skill.id}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid #666",
                            background: "rgba(255,255,255,0.06)",
                          }}
                        >
                          {skill.name}
                        </span>
                      ))
                  )}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #444",
                  borderRadius: 12,
                  padding: 16,
                  display: "grid",
                  gap: 10,
                  marginTop: 6,
                }}
              >
                {filteredSkills.map((skill) => (
                  <label
                    key={skill.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSkillIds.includes(skill.id)}
                      onChange={() => {
                        setSelectedSkillIds((prev) =>
                          prev.includes(skill.id)
                            ? prev.filter((id) => id !== skill.id)
                            : [...prev, skill.id]
                        );
                      }}
                    />
                    <span>{skill.name}</span>
                  </label>
                ))}
              </div>

              <p style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                Tap or click to select multiple skills.
              </p>
            </>
          )}
        </div>

        <div>
          <label>Country</label>
          <br />
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        <div>
          <label>State</label>
          <br />
          <input
            value={stateRegion}
            onChange={(e) => setStateRegion(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        <div>
          <label>City</label>
          <br />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        <div>
          <label>Bio</label>
          <br />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={5}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        <div>
          <strong>Open To</strong>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
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
        </div>

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
      </form>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </div>
  );
}