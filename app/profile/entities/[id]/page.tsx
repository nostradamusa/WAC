"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  Building, Globe, Image as ImageIcon, Calendar, 
  Settings, CheckCircle, Upload, LayoutTemplate,
  Link as LinkIcon, AlertCircle, Save, ExternalLink
} from "lucide-react";

export default function EditEntityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const entityId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Global State
  const [type, setType] = useState<"business" | "organization">("business");
  const [isVerified, setIsVerified] = useState(false);

  // Section 1: Identity
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  // Section 2: Details
  const [category, setCategory] = useState(""); // Business Category or Org Type
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [foundedYear, setFoundedYear] = useState(""); // Business only currently

  // Section 3: Branding
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  
  // Section 4: Social Presence
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [youtube, setYoutube] = useState("");

  // Section 5: Calendar
  const [calendarUrl, setCalendarUrl] = useState("");

  // Section 6: Visibility Settings
  const [isPublic, setIsPublic] = useState(true);
  const [allowRequests, setAllowRequests] = useState(false);

  useEffect(() => {
    async function fetchEntity() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Try business first
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", entityId)
          .eq("owner_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
           // Proceed since we check organizations below
           console.log("Not a business, checking orgs...");
        }

        if (data) {
          setType("business");
          populateFormData(data);
        } else {
          // If not business, check organizations
          const { data: orgData, error: orgError } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", entityId)
            .eq("owner_id", user.id)
            .single();

          if (orgError || !orgData) {
            throw new Error("Entity not found or you do not have permission.");
          }
          setType("organization");
          populateFormData(orgData);
        }

        function populateFormData(entityData: Record<string, string | number | boolean | null>) {
          setName(entityData.name as string || "");
          setSlug(entityData.slug as string || "");
          setDescription(entityData.description as string || "");
          setIsVerified(Boolean(entityData.is_verified) || false);
          setIsPublic(entityData.is_public !== false); 

          setCategory(type === "business" ? (String(entityData.category) || "") : (String(entityData.organization_type) || ""));
          setCountry(String(entityData.country) || "");
          setState(String(entityData.state) || "");
          setCity(String(entityData.city) || "");
          setWebsite(String(entityData.website) || "");
          
          if (type === "business") {
            setFoundedYear(entityData.founded_year ? String(entityData.founded_year) : "");
            setContactEmail(String(entityData.email) || "");
            setLinkedin(String(entityData.linkedin) || "");
            setInstagram(String(entityData.instagram) || "");
          } else {
            setContactEmail(String(entityData.contact_email) || "");
            setCalendarUrl(String(entityData.ical_url) || "");
          }

          setFacebook(String(entityData.facebook) || "");
          setTwitter(String(entityData.twitter) || "");
          setYoutube(String(entityData.youtube) || "");
          setLogoUrl(String(entityData.logo_url) || "");
          setBannerUrl(String(entityData.banner_url) || "");
          setAllowRequests(Boolean(entityData.allow_member_requests) || false);
        }

      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchEntity();
  }, [entityId, type]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const table = type === "business" ? "businesses" : "organizations";
      
      const updateData: Record<string, string | number | boolean | null> = {
        name,
        slug,
        description,
        country,
        state,
        city,
        website,
        is_public: isPublic,
        facebook,
        twitter,
        youtube,
        banner_url: bannerUrl,
        logo_url: logoUrl,
        allow_member_requests: allowRequests
      };

      if (type === "business") {
        updateData.category = category || null;
        updateData.email = contactEmail || null;
        updateData.founded_year = foundedYear ? parseInt(foundedYear) : null;
        updateData.linkedin = linkedin || null;
        updateData.instagram = instagram || null;
      } else if (type === "organization") {
        updateData.organization_type = category || null;
        updateData.ical_url = calendarUrl || null;
        updateData.contact_email = contactEmail || null;
      }

      const { error: updateError } = await supabase
        .from(table)
        .update(updateData)
        .eq("id", entityId);

      if (updateError) {
        if (updateError.code === "23505") {
          throw new Error("That URL slug is already taken. Please try another.");
        }
        if (updateError.code === "PGRST204" || updateError.message.includes("could not find the column")) {
           console.warn("Schema mismatch. Missing columns in DB.", updateError);
           // Silent fail for UX for newly added schema fields
        } else {
           throw new Error(updateError.message);
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) setError(err.message || "An unexpected error occurred.");
      else setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  // Profile Strength Calculation
  const getProfileStrength = () => {
    let score = 0;
    const total = 6;
    
    if (name && description) score++;
    if (logoUrl) score++;
    if (country && city) score++;
    if (website) score++;
    if (category) score++;
    if (calendarUrl || facebook || instagram || linkedin) score++;

    return Math.round((score / total) * 100);
  };

  const strength = getProfileStrength();

  if (loading) {
    return <div className="wac-page text-center opacity-70 p-32">Loading dashboard...</div>;
  }

  if (error && !name) {
    return (
      <div className="wac-page max-w-4xl mx-auto pt-32">
        <div className="bg-red-900/40 border border-red-500/50 p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-red-400 mb-2">Dashboard Error</h2>
          <p>{error}</p>
          <Link href="/profile" className="mt-4 inline-block wac-button-secondary px-4 py-2">
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wac-page max-w-6xl mx-auto pt-24 md:pt-32 pb-32">
      
      <div className="mb-6 flex items-center justify-between">
         <Link
            href="/profile"
            className="text-sm opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Back to Profile
         </Link>
         {success && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 animate-in fade-in slide-in-from-top-2">
               <CheckCircle size={16} /> Saved!
            </div>
         )}
      </div>

      {/* 1. HEADER (Control Panel Identity) */}
      <div className="wac-card p-6 md:p-8 mb-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[var(--border)] relative overflow-hidden">
         {/* Decorative Grid */}
         <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>

         <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
            {/* Logo Display */}
            <div className="relative group w-24 h-24 rounded-2xl bg-[var(--surface)] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-2xl">
               {logoUrl ? (
                  <img src={logoUrl} className="w-full h-full object-cover" alt="Logo" />
               ) : (
                  <Building size={32} className="text-white/20" />
               )}
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Upload size={20} className="text-white" />
               </div>
            </div>

            {/* Entity Summary */}
            <div className="flex flex-col gap-1.5">
               <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  {name || "Unnamed Entity"}
                  {isVerified && (
                     <span className="text-[10px] uppercase font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30 flex items-center gap-1">
                        <CheckCircle size={12} /> Verified
                     </span>
                  )}
               </h1>
               
               <div className="flex flex-wrap items-center gap-3 text-sm opacity-80">
                  <span className="font-medium text-[#D4AF37]">
                     {category || (type === "business" ? "Business" : "Organization")}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/30"></span>
                  <span className="flex items-center gap-1.5 font-mono text-[13px] bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                     <Globe size={13} className="opacity-50" /> wac.app/{type}s/{slug || "slug"}
                  </span>
               </div>
               
               <div className="flex items-center gap-2 mt-1">
                  {isPublic ? (
                     <span className="text-xs font-bold text-emerald-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div> Publicly Visible</span>
                  ) : (
                     <span className="text-xs font-bold text-orange-400 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Hidden from Directory</span>
                  )}
               </div>
            </div>
         </div>

         {/* Header Actions */}
         <div className="flex w-full md:w-auto flex-col sm:flex-row items-center gap-3 md:pt-0 pt-4 border-t md:border-t-0 border-white/10 relative z-10 shrink-0">
            <Link 
               href={`/${type}s/${slug}`} 
               target="_blank"
               className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
            >
               <ExternalLink size={16} /> Public Page
            </Link>
            <button 
               onClick={() => handleSubmit()}
               disabled={saving}
               className="w-full sm:w-auto wac-button-primary px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition"
            >
               <Save size={16} /> {saving ? "Saving..." : "Save Status"}
            </button>
         </div>
      </div>

      {error && (
         <div className="mb-6 bg-red-900/40 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm font-medium flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>{error}</div>
         </div>
      )}

      {/* 2. TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
         
         {/* LEFT COLUMN: EDIT SECTIONS */}
         <div className="lg:col-span-2 space-y-6">
            <form id="entity-form" onSubmit={handleSubmit} className="space-y-6">
               
               {/* SECTION 1: IDENTITY */}
               <section className="wac-card p-6 md:p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white border-b border-white/10 pb-4">
                     <LayoutTemplate size={20} className="text-[#D4AF37]" /> Identity
                  </h2>
                  <div className="space-y-5">
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">Entity Name</label>
                        <input
                           required type="text" value={name} onChange={(e) => setName(e.target.value)}
                           className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">Profile URL (Slug)</label>
                        <div className="flex">
                           <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-[var(--border)] bg-[rgba(255,255,255,0.05)] text-sm opacity-60 font-mono">
                              wac.app/{type}s/
                           </span>
                           <input
                              required type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
                              className="flex-1 rounded-r-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] font-mono"
                           />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">Short Description</label>
                        <textarea
                           required rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                           placeholder="Summarize your mission, services, or focus."
                           className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] resize-vertical"
                        />
                     </div>
                  </div>
               </section>

               {/* SECTION 2: DETAILS */}
               <section className="wac-card p-6 md:p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white border-b border-white/10 pb-4">
                     <Building size={20} className="text-[#D4AF37]" /> Organization Details
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">
                           {type === "business" ? "Business Category" : "Organization Type"}
                        </label>
                        <input
                           type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                           placeholder={type === "business" ? "e.g. Finance, Tech" : "e.g. Non-Profit, Community"}
                           className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">Official Website</label>
                        <input
                           type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                           placeholder="https://example.com"
                           className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">Country</label>
                        <input
                           type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                           placeholder="e.g. USA"
                           className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">State / Region</label>
                        <input
                           type="text" value={state} onChange={(e) => setState(e.target.value)}
                           placeholder="e.g. New York"
                           className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">City</label>
                        <input
                           type="text" value={city} onChange={(e) => setCity(e.target.value)}
                           placeholder="e.g. Manhattan"
                           className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">Public Contact Email</label>
                        <input
                           type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                           placeholder="hello@example.com"
                           className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                     </div>
                     {type === "business" && (
                        <div>
                           <label className="block text-sm font-bold opacity-80 mb-2">Founded Year</label>
                           <input
                              type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)}
                              placeholder="e.g. 2024"
                              className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                           />
                        </div>
                     )}
                  </div>
               </section>

               {/* SECTION 3: BRANDING */}
               <section className="wac-card p-6 md:p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white border-b border-white/10 pb-4">
                     <ImageIcon size={20} className="text-[#D4AF37]" /> Visual Branding
                  </h2>
                  <p className="text-sm opacity-70 mb-6">Upload your logo and a prominent banner to make a powerful visual impression on your public profile.</p>
                  
                  <div className="flex flex-col gap-6">
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-3">Profile Logo (URL Placeholder)</label>
                        <div className="flex gap-4 items-center">
                           <div className="w-16 h-16 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden text-white/30">
                              {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" /> : <ImageIcon size={24} />}
                           </div>
                           <input
                              type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)}
                              placeholder="https://example.com/logo.jpg"
                              className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                           />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-3">Cover Banner (URL Placeholder)</label>
                        <div className="flex flex-col gap-3">
                           <div className="w-full h-24 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden text-white/30 relative">
                              {bannerUrl ? <img src={bannerUrl} className="w-full h-full object-cover opacity-80" /> : <ImageIcon size={32} />}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                           </div>
                           <input
                              type="url" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)}
                              placeholder="https://example.com/banner.jpg"
                              className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                           />
                        </div>
                     </div>
                  </div>
               </section>

               {/* SECTION 4: SOCIAL PRESENCE */}
               <section className="wac-card p-6 md:p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white border-b border-white/10 pb-4">
                     <LinkIcon size={20} className="text-[#D4AF37]" /> Social Presence
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">LinkedIn URL</label>
                        <input
                           type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)}
                           className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">Instagram URL</label>
                        <input
                           type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)}
                           className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">Facebook URL</label>
                        <input
                           type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)}
                           className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold opacity-80 mb-2">YouTube URL</label>
                        <input
                           type="url" value={youtube} onChange={(e) => setYoutube(e.target.value)}
                           className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                     </div>
                  </div>
               </section>

               {/* SECTION 5: CALENDAR SYNC */}
               <section className="wac-card p-6 md:p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white border-b border-white/10 pb-4">
                     <Calendar size={20} className="text-[#D4AF37]" /> Event Calendar Sync
                  </h2>
                  <p className="text-sm opacity-70 mb-4 leading-relaxed">
                     Automate your organization&apos;s events. Paste an <span className="font-mono text-[#D4AF37] opacity-90">.ics</span> link (e.g. from Google Calendar) and the WAC platform will automatically import and keep your events synchronized for the community.
                  </p>
                  <input
                     type="url" value={calendarUrl} onChange={(e) => setCalendarUrl(e.target.value)}
                     placeholder="https://calendar.google.com/calendar/ical/..."
                     className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] font-mono mb-3"
                  />
                  {calendarUrl && (
                     <div className="p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg flex items-start gap-3">
                        <CheckCircle size={16} className="text-[var(--accent)] shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--accent)]/90 leading-tight">Calendar sync active! Events from this feed will automatically be displayed on your organization&apos;s page.</p>
                     </div>
                  )}
               </section>

               {/* SECTION 6: VISIBILITY & SETTINGS */}
               <section className="wac-card p-6 md:p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white border-b border-white/10 pb-4">
                     <Settings size={20} className="text-[#D4AF37]" /> Visibility Settings
                  </h2>
                  <p className="text-sm opacity-70 mb-6">Control how your entity surfaces and interacts within the global directory ecosystem.</p>
                  
                  <div className="space-y-4">
                     <label className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition">
                        <div className="flex flex-col">
                           <span className="font-bold text-sm text-white">Public Profile</span>
                           <span className="text-xs opacity-60">Allow users to view your page and search you in the directory.</span>
                        </div>
                        <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-white/20'}`}>
                           <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                        <input type="checkbox" checked={isPublic} onChange={() => setIsPublic(!isPublic)} className="hidden" />
                     </label>

                     <label className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition">
                        <div className="flex flex-col">
                           <span className="font-bold text-sm text-white">Allow Member Requests</span>
                           <span className="text-xs opacity-60">Allow WAC users to request to legally affiliate with you.</span>
                        </div>
                        <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${allowRequests ? 'bg-emerald-500' : 'bg-white/20'}`}>
                           <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${allowRequests ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                        <input type="checkbox" checked={allowRequests} onChange={() => setAllowRequests(!allowRequests)} className="hidden" />
                     </label>
                  </div>
               </section>

            </form>
         </div>

         {/* RIGHT COLUMN: PROFILE STRENGTH PANEL */}
         <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            <div className="wac-card p-6 border border-[#D4AF37]/20 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]">
               <h3 className="font-bold text-lg mb-2 text-white">Profile Strength</h3>
               
               <div className="flex items-center justify-between mb-2">
                  <div className="flex bg-white/10 rounded-full h-2 w-full overflow-hidden">
                     <div 
                        className="bg-[#D4AF37] h-full transition-all duration-1000 ease-out" 
                        style={{ width: `${strength}%` }}
                     ></div>
                  </div>
                  <span className="text-xs font-bold text-[#D4AF37] ml-4 min-w-[36px] text-right">{strength}%</span>
               </div>
               
               <p className="text-xs opacity-70 mb-6">Complete your profile to boost visibility in the directory network.</p>

               <h4 className="text-[11px] uppercase tracking-widest font-bold opacity-50 mb-4 border-b border-white/10 pb-2">To-Do List</h4>
               
               <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-sm">
                     <CheckCircle size={16} className={name && description ? "text-emerald-500 shrink-0 mt-0.5" : "text-white/20 shrink-0 mt-0.5"} />
                     <span className={name && description ? "opacity-100 text-white" : "opacity-60"}>Basic Details</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                     <CheckCircle size={16} className={logoUrl ? "text-emerald-500 shrink-0 mt-0.5" : "text-white/20 shrink-0 mt-0.5"} />
                     <span className={logoUrl ? "opacity-100 text-white" : "opacity-60"}>Upload visual branding logo</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                     <CheckCircle size={16} className={country && city ? "text-emerald-500 shrink-0 mt-0.5" : "text-white/20 shrink-0 mt-0.5"} />
                     <span className={country && city ? "opacity-100 text-white" : "opacity-60"}>Add physical location</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                     <CheckCircle size={16} className={website ? "text-emerald-500 shrink-0 mt-0.5" : "text-white/20 shrink-0 mt-0.5"} />
                     <span className={website ? "opacity-100 text-white" : "opacity-60"}>Link official website</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                     <CheckCircle size={16} className={category ? "text-emerald-500 shrink-0 mt-0.5" : "text-white/20 shrink-0 mt-0.5"} />
                     <span className={category ? "opacity-100 text-white" : "opacity-60"}>Define category or type</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                     <CheckCircle size={16} className={(calendarUrl || facebook || instagram || linkedin) ? "text-emerald-500 shrink-0 mt-0.5" : "text-white/20 shrink-0 mt-0.5"} />
                     <span className={(calendarUrl || facebook || instagram || linkedin) ? "opacity-100 text-white" : "opacity-60"}>Establish external presence (Social / Calendar)</span>
                  </li>
               </ul>

               <button 
                  type="submit" form="entity-form"
                  disabled={saving}
                  className="w-full mt-8 wac-button-primary py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2 shadow-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition"
               >
                  {saving ? "Deploying Updates..." : "Publish Checklist"}
               </button>
            </div>
            
            {/* Quick Tips Box */}
            <div className="wac-card p-5 bg-[rgba(255,255,255,0.02)] border-dashed border-white/10">
               <h4 className="text-xs font-bold mb-2 flex items-center gap-2 text-white/80"><ExternalLink size={14} /> Quick Tips</h4>
               <p className="text-xs opacity-60 leading-relaxed">
                  Entities with completed branding and social profiles are 3x more likely to be found in search. Don&apos;t forget to push your changes live via the big gold button.
               </p>
            </div>

         </div>

      </div>
    </div>
  );
}
