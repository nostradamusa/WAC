"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Building2, Globe, Image as ImageIcon, Calendar,
  Settings, CheckCircle, ExternalLink, Link as LinkIcon,
  AlertCircle, Save, Landmark, Users, UserPlus, Copy, Check,
  Mail, Shield, Trash2, Clock, ChevronDown,
} from "lucide-react";

export default function EditEntityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const entityId = resolvedParams.id;

  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  // Entity meta
  const [type, setType] = useState<"business" | "organization">("business");
  const [isVerified, setIsVerified] = useState(false);

  // Section 1: Identity
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  // Section 2: Details
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [foundedYear, setFoundedYear] = useState("");

  // Section 3: Branding
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  // Section 4: Social
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");

  // Section 5: Calendar (org only)
  const [calendarUrl, setCalendarUrl] = useState("");

  // Section 6: Visibility
  const [isPublic, setIsPublic] = useState(true);
  const [allowRequests, setAllowRequests] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchEntity() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Try business first
        const { data: bizData } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", entityId)
          .eq("owner_id", user.id)
          .single();

        if (bizData && mounted) {
          setType("business");
          populate(bizData, "business");
        } else {
          const { data: orgData, error: orgError } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", entityId)
            .eq("owner_id", user.id)
            .single();

          if (!orgData || orgError)
            throw new Error("Entity not found or you do not have permission.");
          if (mounted) {
            setType("organization");
            populate(orgData, "organization");
          }
        }
      } catch (err: unknown) {
        if (mounted)
          setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) {
          setLoading(false);
          setIsLoaded(true);
        }
      }
    }

    function populate(
      d: Record<string, unknown>,
      entityType: "business" | "organization",
    ) {
      setName((d.name as string) ?? "");
      setSlug((d.slug as string) ?? "");
      setDescription((d.description as string) ?? "");
      setIsVerified(Boolean(d.is_verified));
      setIsPublic(d.is_public !== false);
      setCountry((d.country as string) ?? "");
      setStateRegion((d.state as string) ?? "");
      setCity((d.city as string) ?? "");
      setWebsite((d.website as string) ?? "");
      setFacebook((d.facebook as string) ?? "");
      setTwitter((d.twitter as string) ?? "");
      setYoutube((d.youtube as string) ?? "");
      setLogoUrl((d.logo_url as string) ?? "");
      setBannerUrl((d.banner_url as string) ?? "");
      setAllowRequests(Boolean(d.allow_member_requests));

      if (entityType === "business") {
        setCategory((d.category as string) ?? "");
        setContactEmail((d.email as string) ?? "");
        setFoundedYear(d.founded_year ? String(d.founded_year) : "");
        setLinkedin((d.linkedin as string) ?? "");
        setInstagram((d.instagram as string) ?? "");
      } else {
        setCategory((d.organization_type as string) ?? "");
        setContactEmail((d.contact_email as string) ?? "");
        setCalendarUrl((d.ical_url as string) ?? "");
      }
    }

    fetchEntity();
    return () => {
      mounted = false;
    };
  }, [entityId]);

  // Autosave — only fires after initial load
  useEffect(() => {
    if (!isLoaded) return;
    const t = setTimeout(() => {
      handleSave();
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    name, slug, description, category, country, stateRegion, city, website,
    contactEmail, foundedYear, logoUrl, bannerUrl,
    linkedin, instagram, facebook, twitter, youtube,
    calendarUrl, isPublic, allowRequests,
  ]);

  async function handleSave() {
    setSaveStatus("saving");
    setError(null);

    try {
      const table = type === "business" ? "businesses" : "organizations";

      const updateData: Record<string, string | number | boolean | null> = {
        name,
        slug,
        description,
        country,
        state: stateRegion,
        city,
        website: website || null,
        is_public: isPublic,
        facebook: facebook || null,
        twitter: twitter || null,
        youtube: youtube || null,
        banner_url: bannerUrl || null,
        logo_url: logoUrl || null,
        allow_member_requests: allowRequests,
      };

      if (type === "business") {
        updateData.category = category || null;
        updateData.email = contactEmail || null;
        updateData.founded_year = foundedYear ? parseInt(foundedYear) : null;
        updateData.linkedin = linkedin || null;
        updateData.instagram = instagram || null;
      } else {
        updateData.organization_type = category || null;
        updateData.ical_url = calendarUrl || null;
        updateData.contact_email = contactEmail || null;
      }

      const { error: updateError } = await supabase
        .from(table)
        .update(updateData)
        .eq("id", entityId);

      if (updateError) {
        if (updateError.code === "23505")
          throw new Error("That URL slug is already taken. Please try another.");
        if (
          updateError.code !== "PGRST204" &&
          !updateError.message.includes("could not find the column")
        ) {
          throw new Error(updateError.message);
        }
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setSaveStatus("idle");
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const isValidCalendarUrl =
    calendarUrl &&
    (calendarUrl.includes("ical") ||
      calendarUrl.endsWith(".ics") ||
      calendarUrl.includes("calendar.google"));

  if (loading) {
    return (
      <div className="wac-page text-center opacity-70 p-32">Loading...</div>
    );
  }

  if (error && !name) {
    return (
      <div className="wac-page max-w-4xl mx-auto pt-32">
        <div className="bg-red-900/40 border border-red-500/50 p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p>{error}</p>
          <Link
            href="/profile"
            className="mt-4 inline-block wac-button-secondary px-4 py-2"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  const EntityIcon = type === "organization" ? Landmark : Building2;

  return (
    <div className="wac-page max-w-4xl mx-auto pt-24 md:pt-32 pb-32">

      {/* Floating autosave indicator */}
      <div className="fixed bottom-6 right-6 z-[100] pointer-events-none">
        {saveStatus === "saving" && (
          <div className="bg-[var(--accent)] text-black px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 animate-pulse">
            <Save size={16} /> Saving...
          </div>
        )}
        {saveStatus === "saved" && (
          <div className="bg-emerald-500 text-white px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2">
            <CheckCircle size={16} /> Saved
          </div>
        )}
      </div>

      <div className="mb-6">
        <Link
          href="/profile"
          className="text-sm opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Profile
        </Link>
      </div>

      {/* HEADER */}
      <div className="wac-card p-6 md:p-8 mb-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[var(--border)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10 w-full md:w-auto">
          <div className="w-20 h-20 rounded-2xl bg-[var(--surface)] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-2xl">
            {logoUrl ? (
              <img
                src={logoUrl}
                className="w-full h-full object-cover"
                alt={name}
              />
            ) : (
              <EntityIcon size={28} className="text-white/20" />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3 flex-wrap">
              {name || "Unnamed Entity"}
              {isVerified && (
                <span className="text-[10px] uppercase font-bold text-[#b08d57] bg-[#b08d57]/10 px-2.5 py-1 rounded-full border border-[#b08d57]/30 flex items-center gap-1">
                  <CheckCircle size={12} /> Verified
                </span>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm opacity-80">
              <span className="font-medium text-[#b08d57]">
                {category || (type === "business" ? "Business" : "Organization")}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-1.5 font-mono text-[12px] bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                <Globe size={12} className="opacity-50" /> wac.app/{type}s/
                {slug || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {isPublic ? (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />{" "}
                  Publicly Visible
                </span>
              ) : (
                <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400" /> Hidden
                  from Directory
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0 w-full md:w-auto">
          <Link
            href={`/${type}s/${slug}`}
            target="_blank"
            className="w-full md:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} /> Public Page
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/40 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      <TeamSection entityId={entityId} entityType={type} entityName={name} />

      <form
        id="entity-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-6"
      >

        {/* SECTION 1: IDENTITY */}
        <section className="wac-card p-6 md:p-8">
          <div className="flex items-center gap-2.5 mb-1">
            <Globe size={18} className="text-[#b08d57]" />
            <h2 className="text-lg font-bold text-white">Identity</h2>
          </div>
          <p className="text-sm opacity-60 mb-6 ml-[26px]">
            Your public name, URL, and description.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                Entity Name
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                Profile URL
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-[var(--border)] bg-[rgba(255,255,255,0.05)] text-sm opacity-60 font-mono whitespace-nowrap">
                  wac.app/{type}s/
                </span>
                <input
                  required
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""),
                    )
                  }
                  className="flex-1 rounded-r-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 font-mono"
                />
              </div>
              <p className="text-xs opacity-40 mt-1.5">
                Only lowercase letters, numbers, and hyphens.
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                Short Description
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summarize your mission, services, or focus."
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 resize-vertical"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: DETAILS */}
        <section className="wac-card p-6 md:p-8">
          <div className="flex items-center gap-2.5 mb-1">
            <EntityIcon size={18} className="text-[#b08d57]" />
            <h2 className="text-lg font-bold text-white">
              {type === "business" ? "Business" : "Organization"} Details
            </h2>
          </div>
          <p className="text-sm opacity-60 mb-6 ml-[26px]">
            Category, location, and contact information.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                {type === "business" ? "Business Category" : "Organization Type"}
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={
                  type === "business"
                    ? "e.g. Finance, Tech"
                    : "e.g. Non-Profit, Community"
                }
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                Official Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. USA"
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                State / Region
              </label>
              <input
                type="text"
                value={stateRegion}
                onChange={(e) => setStateRegion(e.target.value)}
                placeholder="e.g. New York"
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Manhattan"
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                Public Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="hello@example.com"
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
            {type === "business" && (
              <div>
                <label className="block text-sm font-bold text-white/80 mb-2">
                  Founded Year
                </label>
                <input
                  type="number"
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: BRANDING */}
        <section className="wac-card p-6 md:p-8">
          <div className="flex items-center gap-2.5 mb-1">
            <ImageIcon size={18} className="text-[#b08d57]" />
            <h2 className="text-lg font-bold text-white">Visual Branding</h2>
          </div>
          <p className="text-sm opacity-60 mb-6 ml-[26px]">
            Your logo and banner image appear on your public profile.
          </p>

          <div className="space-y-7">
            {/* Logo */}
            <div>
              <label className="block text-sm font-bold text-white/80 mb-3">
                Logo
              </label>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      className="w-full h-full object-cover"
                      alt="Logo preview"
                    />
                  ) : (
                    <EntityIcon size={22} className="text-white/20" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  />
                  <p className="text-xs opacity-40 mt-1.5">
                    Square format recommended (e.g. 400 × 400px).
                  </p>
                </div>
              </div>
            </div>

            {/* Banner */}
            <div>
              <label className="block text-sm font-bold text-white/80 mb-3">
                Cover Banner
              </label>
              <div className="w-full h-28 rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden mb-3 relative">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    className="w-full h-full object-cover"
                    alt="Banner preview"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 opacity-30">
                    <ImageIcon size={26} />
                    <span className="text-xs font-medium">No banner set</span>
                  </div>
                )}
              </div>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
              <p className="text-xs opacity-40 mt-1.5">
                Wide format recommended (e.g. 1500 × 500px).
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: SOCIAL PRESENCE */}
        <section className="wac-card p-6 md:p-8">
          <div className="flex items-center gap-2.5 mb-1">
            <LinkIcon size={18} className="text-[#b08d57]" />
            <h2 className="text-lg font-bold text-white">Social Presence</h2>
          </div>
          <p className="text-sm opacity-60 mb-6 ml-[26px]">
            Connect your external platforms.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {type === "business" && (
              <>
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                Facebook
              </label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                X (Twitter)
              </label>
              <input
                type="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://x.com/..."
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                YouTube
              </label>
              <input
                type="url"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: CALENDAR (org only) */}
        {type === "organization" && (
          <section className="wac-card p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-1">
              <Calendar size={18} className="text-[#b08d57]" />
              <h2 className="text-lg font-bold text-white">
                Event Calendar Sync
              </h2>
            </div>
            <p className="text-sm opacity-60 mb-6 ml-[26px]">
              Paste an{" "}
              <span className="font-mono text-[#b08d57]/80">.ics</span> link
              (e.g. from Google Calendar) and WAC will automatically import and
              keep your events synchronized.
            </p>
            <input
              type="url"
              value={calendarUrl}
              onChange={(e) => setCalendarUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/..."
              className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 font-mono mb-3"
            />
            {isValidCalendarUrl ? (
              <div className="p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg flex items-start gap-3">
                <CheckCircle
                  size={15}
                  className="text-[var(--accent)] shrink-0 mt-0.5"
                />
                <p className="text-xs text-[var(--accent)]/90 leading-tight">
                  Calendar sync active. Events from this feed will appear on
                  your organization&apos;s page.
                </p>
              </div>
            ) : calendarUrl ? (
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle
                  size={15}
                  className="text-orange-400 shrink-0 mt-0.5"
                />
                <p className="text-xs text-orange-300/90 leading-tight">
                  This doesn&apos;t look like a valid calendar URL. Make sure it
                  ends in <span className="font-mono">.ics</span> or comes from
                  Google Calendar.
                </p>
              </div>
            ) : null}
          </section>
        )}

        {/* SECTION 6: VISIBILITY */}
        <section className="wac-card p-6 md:p-8">
          <div className="flex items-center gap-2.5 mb-1">
            <Settings size={18} className="text-[#b08d57]" />
            <h2 className="text-lg font-bold text-white">
              Visibility &amp; Settings
            </h2>
          </div>
          <p className="text-sm opacity-60 mb-6 ml-[26px]">
            Control how your profile surfaces in the directory.
          </p>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/[0.07] transition">
              <div>
                <div className="font-bold text-sm text-white mb-0.5">
                  Public Profile
                </div>
                <div className="text-xs opacity-60">
                  Allow users to view your page and find you in the directory.
                </div>
              </div>
              <div
                className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors shrink-0 ml-4 ${isPublic ? "bg-emerald-500" : "bg-white/20"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isPublic ? "translate-x-5" : "translate-x-0"}`}
                />
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={() => setIsPublic(!isPublic)}
                className="hidden"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/[0.07] transition">
              <div>
                <div className="font-bold text-sm text-white mb-0.5">
                  Allow Affiliation Requests
                </div>
                <div className="text-xs opacity-60">
                  Let users request to be officially affiliated with your
                  organization on WAC — as a member, volunteer, staff, board
                  member, or similar role.
                </div>
              </div>
              <div
                className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors shrink-0 ml-4 ${allowRequests ? "bg-emerald-500" : "bg-white/20"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${allowRequests ? "translate-x-5" : "translate-x-0"}`}
                />
              </div>
              <input
                type="checkbox"
                checked={allowRequests}
                onChange={() => setAllowRequests(!allowRequests)}
                className="hidden"
              />
            </label>
          </div>
        </section>

      </form>
    </div>
  );
}

// ─── TeamSection ──────────────────────────────────────────────────────────────

type Member = {
  user_id: string;
  role: string;
  profile: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
};

const ROLE_OPTIONS = ["member", "editor", "admin"] as const;
type InviteRole = typeof ROLE_OPTIONS[number];

function TeamSection({
  entityId,
  entityType,
  entityName,
}: {
  entityId: string;
  entityType: "business" | "organization";
  entityName: string;
}) {
  const [members, setMembers]               = useState<Member[]>([]);
  const [pending, setPending]               = useState<PendingInvite[]>([]);
  const [currentUserId, setCurrentUserId]   = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Invite form state
  const [inviteEmail, setInviteEmail]       = useState("");
  const [inviteRole, setInviteRole]         = useState<InviteRole>("member");
  const [sending, setSending]               = useState(false);
  const [inviteError, setInviteError]       = useState<string | null>(null);
  const [inviteLink, setInviteLink]         = useState<string | null>(null);
  const [copied, setCopied]                 = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const [{ data: roles }, { data: invites }] = await Promise.all([
      supabase
        .from("entity_roles")
        .select("user_id, role, profile:profiles(full_name, username, avatar_url)")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId),
      supabase
        .from("entity_invites")
        .select("id, email, role, token, expires_at")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

    setMembers((roles as any[]) ?? []);
    setPending((invites as any[]) ?? []);
    setLoadingMembers(false);
  }

  useEffect(() => { load(); }, [entityId, entityType]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSending(true);
    setInviteError(null);
    setInviteLink(null);

    const { error } = await supabase.rpc("invite_to_entity", {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_email: inviteEmail.trim().toLowerCase(),
      p_role: inviteRole,
    });

    if (error) {
      setInviteError(error.message.includes("already") ? "This person already has access or a pending invite." : error.message);
      setSending(false);
      return;
    }

    // Fetch the token we just created
    const { data: inv } = await supabase
      .from("entity_invites")
      .select("token")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("email", inviteEmail.trim().toLowerCase())
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const link = inv?.token
      ? `${window.location.origin}/invite/${inv.token}`
      : null;

    setInviteLink(link);
    setInviteEmail("");
    setSending(false);
    load();
  }

  async function handleRevokeInvite(inviteId: string) {
    await supabase
      .from("entity_invites")
      .update({ status: "revoked" })
      .eq("id", inviteId);
    load();
  }

  async function handleRemoveMember(userId: string) {
    await supabase.rpc("revoke_entity_role", {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_user_id: userId,
    });
    load();
  }

  function copyLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const roleColor: Record<string, string> = {
    owner:  "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/25",
    admin:  "text-violet-400 bg-violet-500/10 border-violet-500/20",
    editor: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    member: "text-white/50 bg-white/5 border-white/10",
  };

  return (
    <section className="wac-card p-6 md:p-8 mb-6">
      <div className="flex items-center gap-2.5 mb-1">
        <Users size={18} className="text-[#b08d57]" />
        <h2 className="text-lg font-bold text-white">Team &amp; Members</h2>
      </div>
      <p className="text-sm opacity-60 mb-6 ml-[26px]">
        Invite people to manage <span className="text-white/70">{entityName || "this entity"}</span>. They will receive a link to accept.
      </p>

      {/* ── Invite form ──────────────────────────────────────────────────── */}
      <form onSubmit={handleInvite} className="mb-6">
        <label className="block text-sm font-bold text-white/80 mb-2">Send Invite</label>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-0">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>

          {/* Role picker */}
          <div className="relative">
            <Shield size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as InviteRole)}
              className="pl-8 pr-8 py-3 rounded-xl border border-[var(--border)] bg-[#111] text-sm outline-none transition focus:border-[var(--accent)] appearance-none cursor-pointer capitalize"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>

          <button
            type="submit"
            disabled={sending || !inviteEmail.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--accent)] text-black font-bold text-sm disabled:opacity-40 hover:bg-[var(--accent)]/90 transition whitespace-nowrap"
          >
            <UserPlus size={14} />
            {sending ? "Sending…" : "Send Invite"}
          </button>
        </div>

        {inviteError && (
          <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
            <AlertCircle size={12} /> {inviteError}
          </p>
        )}
      </form>

      {/* ── Generated invite link ────────────────────────────────────────── */}
      {inviteLink && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.04]">
          <p className="text-xs font-bold text-[var(--accent)] mb-2 flex items-center gap-1.5">
            <CheckCircle size={12} /> Invite created — share this link:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-white/70 bg-black/30 px-3 py-2 rounded-lg truncate border border-white/10">
              {inviteLink}
            </code>
            <button
              onClick={copyLink}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 text-xs font-bold transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-[10px] text-white/30 mt-2">Link expires in 7 days. Anyone with this link can join as {pending.find(p => inviteLink.includes(p.token))?.role ?? inviteRole}.</p>
        </div>
      )}

      {/* ── Pending invites ──────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-1.5">
            <Clock size={11} /> Pending Invites ({pending.length})
          </p>
          <div className="space-y-2">
            {pending.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Mail size={12} className="text-white/30" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/75 truncate">{inv.email}</p>
                    <p className="text-[10px] text-white/35">
                      Expires {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border capitalize ${roleColor[inv.role] ?? roleColor.member}`}>
                    {inv.role}
                  </span>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/invite/${inv.token}`;
                      navigator.clipboard.writeText(link);
                    }}
                    title="Copy link"
                    className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => handleRevokeInvite(inv.id)}
                    title="Revoke invite"
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/5 transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Current members ──────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-1.5">
          <Users size={11} /> Current Members ({loadingMembers ? "…" : members.length})
        </p>
        {loadingMembers ? (
          <div className="text-sm text-white/30 py-4 text-center">Loading…</div>
        ) : members.length === 0 ? (
          <div className="text-sm text-white/30 py-4 text-center">No members yet.</div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const isYou = m.user_id === currentUserId;
              const isOwner = m.role === "owner";
              const displayName = m.profile?.full_name || m.profile?.username || "Unknown User";
              const initial = displayName.charAt(0).toUpperCase();
              return (
                <div key={m.user_id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center shrink-0 text-[var(--accent)] text-xs font-bold">
                      {m.profile?.avatar_url
                        ? <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                        : initial
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">
                        {displayName}
                        {isYou && <span className="ml-1.5 text-[10px] text-white/30">(you)</span>}
                      </p>
                      {m.profile?.username && (
                        <p className="text-[10px] text-white/35">@{m.profile.username}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border capitalize ${roleColor[m.role] ?? roleColor.member}`}>
                      {m.role}
                    </span>
                    {!isOwner && !isYou && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        title="Remove member"
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/5 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
