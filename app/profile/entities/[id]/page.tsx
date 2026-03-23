"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Building2, Globe, Image as ImageIcon, Calendar,
  Settings, CheckCircle, ExternalLink, Link as LinkIcon,
  AlertCircle, Save, Landmark, Users, UserPlus, Copy, Check,
  Mail, Shield, Trash2, Clock, ChevronDown, Flag, HeartHandshake, Eye, MapPin
} from "lucide-react";

type InviteRole = "owner" | "admin" | "editor" | "member";
const ROLE_OPTIONS: InviteRole[] = ["owner", "admin", "editor", "member"];

interface Member {
  user_id: string;
  role: string;
  profile?: { full_name?: string; username?: string; avatar_url?: string };
}
interface PendingInvite {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
}

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

  // Identity & Hero
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  // About & Mission
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");
  const [foundedYear, setFoundedYear] = useState("");

  // Trust & Contact
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");

  // Pulse & Announcements Controls
  const [calendarUrl, setCalendarUrl] = useState(""); // org only

  // Network Context & Visibility
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

  const isValidCalendarUrl =
    calendarUrl &&
    (calendarUrl.includes("ical") ||
      calendarUrl.endsWith(".ics") ||
      calendarUrl.includes("calendar.google"));

  if (loading) {
    return (
      <div className="w-full min-h-screen pt-32 text-center text-white/50">Loading editor...</div>
    );
  }

  if (error && !name) {
    return (
      <div className="wac-page max-w-4xl mx-auto pt-32 px-4">
        <div className="bg-red-900/40 border border-red-500/50 p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p>{error}</p>
          <Link href="/profile" className="mt-4 inline-block px-4 py-2 bg-white/10 rounded-xl font-bold text-white hover:bg-white/15 transition">
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  const publicUrl = type === "business" ? `/businesses/${slug}` : `/organizations/${slug}`;
  const accentColor = type === "business" ? "var(--accent)" : "#10b981"; // Gold vs Emerald
  const accentClass = type === "business" ? "text-[var(--accent)]" : "text-emerald-400";
  const borderFocusClass = type === "business" ? "focus:border-[var(--accent)]" : "focus:border-emerald-500";
  const iconBgClass = type === "business" ? "bg-[var(--accent)]/10" : "bg-emerald-500/10";

  return (
    <div className="w-full min-h-screen bg-[var(--background)] pt-20 pb-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/profile" className="text-sm font-semibold text-white/40 hover:text-white transition-colors flex items-center gap-1.5 mb-2">
              &larr; Back to Account
            </Link>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Manage {type === "business" ? "Business" : "Organization"}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Changes auto-save. This is the admin-face for your public hub.
            </p>
          </div>
          
          <Link
            href={publicUrl}
            target="_blank"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-colors w-full sm:w-auto"
          >
            <ExternalLink size={16} /> View Live Page
          </Link>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm font-medium flex gap-3 items-start">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-8">
          
          {/* SECTION 1: PUBLIC IDENTITY & HERO */}
          <section className="wac-card p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClass} ${accentClass}`}>
                {type === "business" ? <Building2 size={18} /> : <Landmark size={18} />}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Public Identity</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Entity Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none transition ${borderFocusClass}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Public URL (Slug)</label>
                  <div className="relative">
                    <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white outline-none transition ${borderFocusClass}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Category or Type</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder={type === "business" ? "e.g. Technology, Retail" : "e.g. Non-Profit, Student Group"}
                    className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none transition ${borderFocusClass}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Square Avatar / Logo URL</label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center text-white/20">
                      {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={20} />}
                    </div>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://..."
                      className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none transition ${borderFocusClass}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Hero Banner URL</label>
                  <input
                    type="url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://..."
                    className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none transition ${borderFocusClass}`}
                  />
                  <p className="text-[10px] text-white/40">Displays as the background cover of your public hub.</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: ABOUT / MISSION */}
          <section className="wac-card p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClass} ${accentClass}`}>
                <Flag size={18} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">About & Mission</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Detailed Description / Mission</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder={`Detail the ${type}'s founding context, mission, and who it serves...`}
                  className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none transition resize-none ${borderFocusClass}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none transition ${borderFocusClass}`}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">State / Region</label>
                  <input
                    type="text"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none transition ${borderFocusClass}`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none transition ${borderFocusClass}`}
                  />
                </div>
              </div>

              {type === "business" && (
                <div className="max-w-xs">
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Founded Year</label>
                  <input
                    type="number"
                    value={foundedYear}
                    onChange={(e) => setFoundedYear(e.target.value)}
                    placeholder="e.g. 2018"
                    className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none transition ${borderFocusClass}`}
                  />
                </div>
              )}
            </div>
          </section>

          {/* SECTION 3: VISIBILITY & NETWORK CONTEXT */}
          <section className="wac-card p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClass} ${accentClass}`}>
                <Eye size={18} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Visibility & Network Context</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="block text-sm font-bold text-white">Public Directory</span>
                    <span className="block text-[11px] text-white/50 mt-1 max-w-[200px]">Allow discovery in the global WAC directory and global search.</span>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-white/20'}`} onClick={() => setIsPublic(!isPublic)}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
              </div>

              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02]">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="block text-sm font-bold text-white">Member Requests</span>
                    <span className="block text-[11px] text-white/50 mt-1 max-w-[200px]">Allow users to actively request to join your internal roster.</span>
                  </div>
                  <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${allowRequests ? 'bg-emerald-500' : 'bg-white/20'}`} onClick={() => setAllowRequests(!allowRequests)}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowRequests ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* SECTION 4: TRUST & CONTACT */}
          <section className="wac-card p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClass} ${accentClass}`}>
                <Globe size={18} />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Trust & Contact</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Website URL</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none transition ${borderFocusClass}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Public Contact Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none transition ${borderFocusClass}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              {type === "business" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">LinkedIn</label>
                  <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)}
                    className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none transition ${borderFocusClass}`} />
                </div>
              )}
              {type === "business" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Instagram</label>
                  <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)}
                    className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none transition ${borderFocusClass}`} />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Facebook</label>
                <input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)}
                  className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none transition ${borderFocusClass}`} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">X / Twitter</label>
                <input type="url" value={twitter} onChange={(e) => setTwitter(e.target.value)}
                  className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none transition ${borderFocusClass}`} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2">YouTube</label>
                <input type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)}
                  className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none transition ${borderFocusClass}`} />
              </div>
            </div>
          </section>

          {/* SECTION 5: PULSE / EVENTS (Org Only) */}
          {type === "organization" && (
            <section className="wac-card p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClass} ${accentClass}`}>
                  <Calendar size={18} />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Events Sync</h2>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-2 flex items-center gap-2">
                  Public iCal URL
                  {isValidCalendarUrl && <CheckCircle size={14} className="text-emerald-400" />}
                </label>
                <input
                  type="url"
                  value={calendarUrl}
                  onChange={(e) => setCalendarUrl(e.target.value)}
                  placeholder="https://calendar.google.com/calendar/ical/..."
                  className={`w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none transition ${borderFocusClass}`}
                />
                <p className="mt-2 text-[11px] text-white/40 leading-relaxed max-w-xl">
                  Paste the iCal (.ics) link from your Google Calendar, Outlook, or Apple Calendar to automatically populate your Events tab and global calendar.
                </p>
              </div>
            </section>
          )}

          {/* SECTION 6: TEAM & MEMBERS */}
          <TeamSection entityId={entityId} entityType={type} entityName={name} accentClass={accentClass} iconBgClass={iconBgClass} />

        </div>
      </div>

      {/* FIXED AUTO-SAVE BANNER */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none z-50">
        <div className="mx-auto max-w-sm">
          {saveStatus === "saving" && (
            <div className="backdrop-blur-md bg-black/60 border border-white/10 text-white/70 px-4 py-3 rounded-full flex items-center justify-center gap-2 shadow-xl shadow-black/40 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4">
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Saving changes...
            </div>
          )}
          {saveStatus === "saved" && (
            <div className="backdrop-blur-md bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-full flex items-center justify-center gap-2 shadow-xl shadow-black/40 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4">
              <CheckCircle size={16} /> All changes saved
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── TeamSection ──────────────────────────────────────────────────────────────

function TeamSection({
  entityId,
  entityType,
  entityName,
  accentClass,
  iconBgClass
}: {
  entityId: string;
  entityType: "business" | "organization";
  entityName: string;
  accentClass: string;
  iconBgClass: string;
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

    const link = inv?.token ? `${window.location.origin}/invite/${inv.token}` : null;
    setInviteLink(link);
    setInviteEmail("");
    setSending(false);
    load();
  }

  async function handleRevokeInvite(inviteId: string) {
    await supabase.from("entity_invites").update({ status: "revoked" }).eq("id", inviteId);
    load();
  }

  async function handleRemoveMember(userId: string) {
    await supabase.rpc("revoke_entity_role", { p_entity_type: entityType, p_entity_id: entityId, p_user_id: userId });
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

  const btnAccent = entityType === "business" ? "bg-[#b08d57] text-black hover:bg-[#9a7b48]" : "bg-emerald-500 text-white hover:bg-emerald-600";
  const btnBorder = entityType === "business" ? "focus:border-[#b08d57]" : "focus:border-emerald-500";

  return (
    <section className="wac-card p-6 md:p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClass} ${accentClass}`}>
          <Users size={18} />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Team & Members</h2>
      </div>
      <p className="text-sm opacity-60 mb-6 leading-relaxed">
        Invite people to manage <span className="text-white font-medium">{entityName || "this entity"}</span>. They will receive a link to accept.
      </p>

      {/* ── Invite form — Formatted cleanly for Mobile ── */}
      <form onSubmit={handleInvite} className="mb-8 p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
        <label className="block text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Send Roster Invite</label>
        
        {/* Mobile Stacked Layout Array */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className={`w-full pl-11 pr-4 py-3.5 rounded-xl border border-[var(--border)] bg-[#111] text-sm text-white outline-none transition ${btnBorder}`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative w-full">
              <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as InviteRole)}
                className={`w-full pl-11 pr-10 py-3.5 rounded-xl border border-[var(--border)] bg-[#111] text-sm text-white outline-none transition appearance-none cursor-pointer capitalize ${btnBorder}`}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={sending || !inviteEmail.trim()}
              className={`w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm disabled:opacity-40 transition whitespace-nowrap active:scale-[0.98] ${btnAccent}`}
            >
              <UserPlus size={16} />
              {sending ? "Sending…" : "Send Invite"}
            </button>
          </div>
        </div>

        {inviteError && (
          <p className="mt-4 text-xs font-semibold text-red-400 flex items-center gap-1.5 bg-red-900/10 p-2.5 rounded-lg">
            <AlertCircle size={14} /> {inviteError}
          </p>
        )}
      </form>

      {/* ── Generated invite link ── */}
      {inviteLink && (
        <div className="mb-8 p-5 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/[0.03]">
          <p className="text-sm font-bold text-[var(--accent)] mb-3 flex items-center gap-2">
            <CheckCircle size={16} /> Invite created — share this secure link:
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <code className="flex-1 w-full overflow-hidden text-xs font-mono text-white/80 bg-black/40 px-4 py-3.5 rounded-xl border border-white/10 break-all">
              {inviteLink}
            </code>
            <button
              onClick={copyLink}
              className={`w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[var(--accent)]/30 text-sm font-bold transition hover:bg-[var(--accent)]/10 text-white ${btnBorder}`}
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
          <p className="text-[11px] text-white/40 mt-3 font-medium">Link expires in 7 days. Anyone with this link can join as an authorized member.</p>
        </div>
      )}

      {/* ── Pending invites ── */}
      {pending.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-1.5">
            <Clock size={13} /> Pending Invites ({pending.length})
          </p>
          <div className="space-y-3">
            {pending.map((inv) => (
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 rounded-xl bg-white/[0.02] border border-[var(--border)] overflow-hidden">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-white/40" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate pr-4">{inv.email}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      Expires {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${roleColor[inv.role] ?? roleColor.member}`}>
                    {inv.role}
                  </span>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invite/${inv.token}`); }} title="Copy link" className="flex-1 sm:flex-none flex items-center justify-center p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition border border-white/5 sm:border-transparent">
                    <Copy size={15} />
                  </button>
                  <button onClick={() => handleRevokeInvite(inv.id)} title="Revoke invite" className="flex-1 sm:flex-none flex items-center justify-center p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition border border-white/5 sm:border-transparent">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Current members ── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-1.5">
          <Users size={13} /> Current Members ({loadingMembers ? "…" : members.length})
        </p>
        {loadingMembers ? (
          <div className="text-sm text-white/30 py-8 text-center bg-white/[0.01] rounded-xl border border-white/5 animate-pulse">Loading roster…</div>
        ) : members.length === 0 ? (
          <div className="text-sm text-white/40 py-8 text-center bg-white/[0.01] rounded-xl border border-white/5 font-medium">No external members found.</div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => {
              const isYou = m.user_id === currentUserId;
              const isOwner = m.role === "owner";
              const displayName = m.profile?.full_name || m.profile?.username || "Unknown Administrator";
              const initial = displayName.charAt(0).toUpperCase();
              return (
                <div key={m.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 rounded-xl bg-white/[0.02] border border-[var(--border)] overflow-hidden">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${iconBgClass} ${accentClass} border border-current`}>
                      {m.profile?.avatar_url
                        ? <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                        : initial
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white/90 truncate pr-4 flex items-center gap-2">
                        {displayName}
                        {isYou && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-white/10 text-white/60">You</span>}
                      </p>
                      {m.profile?.username && (
                        <p className="text-[11px] text-white/40 font-medium mt-0.5">@{m.profile.username}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0 border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${roleColor[m.role] ?? roleColor.member}`}>
                      {m.role}
                    </span>
                    {!isOwner && !isYou && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="p-2 rounded-lg text-white/40 font-semibold text-xs hover:text-red-400 hover:bg-red-500/10 transition border border-white/5 sm:border-transparent flex items-center gap-1.5"
                      >
                        <Trash2 size={13} /> Remove
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
