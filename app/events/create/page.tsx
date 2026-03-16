"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CreateEventPage() {
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [showInsight, setShowInsight] = useState(false);
  const [conflictingEvents, setConflictingEvents] = useState<any[]>([]);

  // Phase 3: Event Conflict Awareness Logic (Real DB Query)
  useEffect(() => {
    async function checkConflicts() {
      if (!city || !date) {
        setShowInsight(false);
        setConflictingEvents([]);
        return;
      }

      const queryDate = new Date(date);
      if (isNaN(queryDate.getTime())) return;

      const startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("events")
        .select("title, city, state")
        .ilike("city", `%${city.trim()}%`)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .limit(3);

      if (data && data.length > 0) {
        setConflictingEvents(data);
        setShowInsight(true);
      } else {
        setShowInsight(false);
        setConflictingEvents([]);
      }
    }

    const timer = setTimeout(() => {
      checkConflicts();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [city, date]);

  return (
    <div className="wac-page pb-24 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100 hover:text-emerald-400 transition"
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
          Back to Events
        </Link>
      </div>

      <div className="wac-card bg-[var(--surface)] p-8 md:p-12 rounded-3xl border border-[var(--border)] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-white">
          Create an Event
        </h1>
        <p className="opacity-70 mb-10 text-lg">
          Schedule an event for your organization and share it with the
          diaspora.
        </p>

        <form
          className="space-y-8 relative z-10"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Event Title
              </label>
              <input
                type="text"
                placeholder="e.g. Albanian Tech Meetup 2026"
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-white/20"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all color-scheme-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. New York"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-white/20"
                />
              </div>
            </div>

            {/* Insight Area */}
            {showInsight && (
              <div className="border border-amber-500/30 bg-amber-500/10 p-5 rounded-2xl flex gap-4 animate-in fade-in slide-in-from-top-4 duration-500 text-amber-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 mt-0.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <h4 className="font-bold opacity-100 text-amber-400 mb-1">
                    Community Calendar Insight
                  </h4>
                  <p className="opacity-90 text-sm leading-relaxed mb-3">
                    There {conflictingEvents.length === 1 ? "is" : "are"}{" "}
                    <strong>
                      {conflictingEvents.length} other Albanian event
                      {conflictingEvents.length !== 1 && "s"}
                    </strong>{" "}
                    happening in the {city} region around {date}.
                  </p>
                  <div className="flex flex-col gap-2">
                    {conflictingEvents.map((evt, idx) => (
                      <div
                        key={idx}
                        className="bg-amber-950/40 rounded-lg p-3 text-xs border border-amber-500/20"
                      >
                        <div className="font-bold text-amber-300">
                          {evt.title}
                        </div>
                        <div className="opacity-70">{evt.city} • Same Day</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Description
              </label>
              <textarea
                rows={5}
                placeholder="Details about your event..."
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-white/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2">
                Visibility
              </label>
              <div className="flex gap-4">
                <label className="flex-1 flex items-center gap-3 p-4 rounded-xl border border-emerald-500/50 bg-emerald-500/10 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    defaultChecked
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-emerald-100 text-sm">
                      Public Event
                    </div>
                    <div className="text-xs opacity-60">
                      Visible to everyone in the network
                    </div>
                  </div>
                </label>
                <label className="flex-1 flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] cursor-pointer hover:bg-[var(--background)] transition">
                  <input
                    type="radio"
                    name="visibility"
                    disabled
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-sm">Members Only</div>
                    <div className="text-xs opacity-60">
                      Visible only to joined members
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border)] flex justify-end gap-4">
            <button
              type="button"
              className="px-6 py-3 rounded-full font-bold text-white/70 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-500 text-white px-8 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 transition-colors"
            >
              Publish Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
