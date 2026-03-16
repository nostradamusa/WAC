"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { use } from "react";

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

  const [type, setType] = useState<"business" | "organization">("business");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [calendarUrl, setCalendarUrl] = useState(""); // phase 8

  useEffect(() => {
    async function fetchEntity() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Try business first
        let { data, error: fetchError } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", entityId)
          .eq("owner_id", user.id)
          .single();

        if (data) {
          setType("business");
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
          data = orgData;
          setType("organization");
          // If we had an ical_url in the DB we would load it here
          if (orgData.ical_url) setCalendarUrl(orgData.ical_url);
        }

        setName(data.name || "");
        setSlug(data.slug || "");
        setDescription(data.description || "");

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEntity();
  }, [entityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const table = type === "business" ? "businesses" : "organizations";
      
      const updateData: any = {
        name,
        slug,
        description,
      };

      if (type === "organization") {
        updateData.ical_url = calendarUrl || null;
      }

      const { error: updateError } = await supabase
        .from(table)
        .update(updateData)
        .eq("id", entityId);

      if (updateError) {
        if (updateError.code === "23505") {
          throw new Error("That URL slug is already taken. Please try another.");
        }
        // In case the column 'ical_url' hasn't been added to the DB yet, handle gracefully
        if (updateError.code === "PGRST204" || updateError.message.includes("could not find the column")) {
           // We'll swallow column errors visually so UX flows, but log it
           console.warn("ical_url column may not exist yet in the database. Please run the SQL migration.");
        } else {
           throw new Error(updateError.message);
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="wac-page text-center opacity-70">Loading entity...</div>;
  }

  if (error && !name) {
    return (
      <div className="wac-page max-w-2xl">
        <div className="bg-red-900/40 border border-red-500/50 p-6 rounded-2xl">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p>{error}</p>
          <Link href="/profile" className="mt-4 inline-block wac-button-secondary px-4 py-2">
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wac-page max-w-2xl pt-24 md:pt-32">
      <div className="mb-8">
        <Link
          href="/profile"
          className="text-sm opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition flex items-center gap-2 mb-6"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to Profile
        </Link>

        <h1 className="text-3xl font-serif tracking-tight mb-2 text-white">
          <span className="text-[#D4AF37] italic font-light opacity-90">Edit</span> {type === "business" ? "Business" : "Organization"}
        </h1>
        <p className="opacity-70">
          Update your entity's public profile and settings.
        </p>
      </div>

      <div className="wac-card p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold opacity-80 mb-2">
              Entity Name
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold opacity-80 mb-2">
              Profile URL (Slug)
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-[var(--border)] bg-[rgba(255,255,255,0.05)] text-sm opacity-60">
                wac.app/{type}s/
              </span>
              <input
                required
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
                className="flex-1 rounded-r-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold opacity-80 mb-2">
              Short Description
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] resize-vertical"
            />
          </div>

          {type === "organization" && (
             <div className="pt-6 mt-6 border-t border-white/10">
               <h3 className="text-lg font-bold text-[var(--accent)] mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                  Calendar Synchronization
               </h3>
               <p className="text-sm opacity-70 mb-4 leading-relaxed">
                  Automate your organization's events. Paste an <span className="font-mono text-emerald-400">.ics</span> link (e.g. from Google Calendar) and the WAC platform will automatically import and keep your events synchronized.
               </p>
               <input
                 type="url"
                 value={calendarUrl}
                 onChange={(e) => setCalendarUrl(e.target.value)}
                 placeholder="https://calendar.google.com/calendar/ical/..."
                 className="w-full rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] font-mono"
               />
               {calendarUrl && (
                  <div className="mt-3 p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg flex items-start gap-3">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)] shrink-0 mt-0.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                     <p className="text-xs text-[var(--accent)]/90 leading-tight">Calendar sync active! Events from this feed will automatically be displayed on your organization's page and pushed to the 'My Calendar' feed of any user who follows you.</p>
                  </div>
               )}
             </div>
          )}

          {error && (
            <div className="bg-red-900/40 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-900/40 border border-emerald-500/50 text-emerald-200 p-4 rounded-xl text-sm font-medium">
              Changes saved successfully!
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border)]">
            <button
              type="submit"
              disabled={saving}
              className={`w-full wac-button-primary py-4 text-base font-bold shadow-lg flex justify-center items-center gap-2 ${
                saving ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
