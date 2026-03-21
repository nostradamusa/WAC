"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CalendarDays, AlertCircle } from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();

  const [title,  setTitle]  = useState("");
  const [date,   setDate]   = useState("");
  const [city,   setCity]   = useState("");
  const [desc,   setDesc]   = useState("");

  const [showInsight,       setShowInsight]       = useState(false);
  const [conflictingEvents, setConflictingEvents] = useState<any[]>([]);

  // Event conflict awareness — debounced DB check
  useEffect(() => {
    if (!city || !date) { setShowInsight(false); setConflictingEvents([]); return; }

    const timer = setTimeout(async () => {
      const queryDate = new Date(date);
      if (isNaN(queryDate.getTime())) return;

      const startOfDay = new Date(queryDate); startOfDay.setHours(0,  0,  0, 0);
      const endOfDay   = new Date(queryDate); endOfDay.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from("events")
        .select("title, city, state")
        .ilike("city", `%${city.trim()}%`)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .limit(3);

      if (data && data.length > 0) { setConflictingEvents(data); setShowInsight(true); }
      else { setShowInsight(false); setConflictingEvents([]); }
    }, 500);

    return () => clearTimeout(timer);
  }, [city, date]);

  return (
    <main className="min-h-screen bg-[var(--background)] pt-14">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-24">

        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition mb-8"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back
        </button>

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#b08d57]/[0.08] border border-[#b08d57]/20 flex items-center justify-center shrink-0">
            <CalendarDays size={18} className="text-[#b08d57]/70" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="font-serif text-xl tracking-tight text-white leading-none mb-0.5">
              Create an{" "}
              <span className="italic font-light opacity-90 text-[#b08d57]">Event</span>
            </h1>
            <p className="text-xs text-white/35">
              Share an event with the Albanian network
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="wac-card p-6 md:p-8 space-y-6">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-[0.12em] mb-2">
              Event Title
            </label>
            <input
              id="event-title"
              name="event-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Albanian Tech Meetup 2026"
              className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#b08d57]/40 transition placeholder:text-white/20"
            />
          </div>

          {/* Date + City row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-[0.12em] mb-2">
                Date
              </label>
              <input
                id="event-date"
                name="event-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#b08d57]/40 transition [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-[0.12em] mb-2">
                City
              </label>
              <input
                id="event-city"
                name="event-city"
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. New York"
                className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#b08d57]/40 transition placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Conflict insight */}
          {showInsight && (
            <div className="border border-[#b08d57]/25 bg-[#b08d57]/[0.05] rounded-xl p-4 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle size={16} className="text-[#b08d57]/70 shrink-0 mt-0.5" strokeWidth={1.8} />
              <div>
                <p className="text-xs font-semibold text-[#b08d57]/80 mb-1">Calendar Conflict</p>
                <p className="text-xs text-white/50 leading-relaxed mb-2">
                  {conflictingEvents.length} other Albanian event{conflictingEvents.length !== 1 ? "s" : ""} in{" "}
                  <span className="text-white/70">{city}</span> around this date.
                </p>
                <div className="space-y-1.5">
                  {conflictingEvents.map((evt, i) => (
                    <div key={i} className="text-xs px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                      <span className="text-white/65 font-medium">{evt.title}</span>
                      <span className="text-white/30 ml-1.5">· {evt.city}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-[0.12em] mb-2">
              Description
            </label>
            <textarea
              id="event-desc"
              name="event-desc"
              rows={5}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Details about your event…"
              className="w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#b08d57]/40 transition resize-none placeholder:text-white/20 leading-relaxed"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-[0.12em] mb-3">
              Visibility
            </label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center gap-3 p-3.5 rounded-xl border border-[#b08d57]/30 bg-[#b08d57]/[0.05] cursor-pointer">
                <input type="radio" name="visibility" defaultChecked className="accent-[#b08d57]" />
                <div>
                  <div className="text-xs font-semibold text-white/80">Public</div>
                  <div className="text-[10px] text-white/35 mt-0.5">Visible to everyone</div>
                </div>
              </label>
              <label className="flex-1 flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.08] cursor-not-allowed opacity-40">
                <input type="radio" name="visibility" disabled className="accent-[#b08d57]" />
                <div>
                  <div className="text-xs font-semibold text-white/80">Members Only</div>
                  <div className="text-[10px] text-white/35 mt-0.5">Coming soon</div>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-white/40 hover:text-white/70 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {/* submit handler — wired once events DB is ready */}}
              className="bg-[#b08d57] hover:bg-[#9a7545] text-black px-7 py-2.5 rounded-full text-sm font-bold transition"
            >
              Publish Event
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}
