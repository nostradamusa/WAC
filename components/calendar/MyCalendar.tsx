"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Filter,
  MapPin,
  Users,
  Building2,
  CheckCircle2,
} from "lucide-react";

// Mock Data highlighting Cross-Org Collaboration
const MOCK_EVENTS = [
  {
    id: "e1",
    date: "2026-03-22",
    day: "22",
    month: "Mar",
    title: "SAT Prep Boot Camp for Albanian Students",
    coHosts: ["AACC Riverdale", "Albanian Students Alliance"],
    location: "AACC Bronx Campus",
    time: "10:00 AM - 2:00 PM EST",
    tags: ["Teens", "Education"],
    isSubscribed: true,
  },
  {
    id: "e2",
    date: "2026-04-05",
    day: "05",
    month: "Apr",
    title: "Spring Family Picnic & Playdate",
    coHosts: ["WAC Parent Connect"],
    location: "Van Cortlandt Park, NY",
    time: "12:00 PM - 4:00 PM EST",
    tags: ["Parents", "Community"],
    isSubscribed: true,
  },
  {
    id: "e3",
    date: "2026-04-12",
    day: "12",
    month: "Apr",
    title: "Real Estate Investment Syndicate Masterclass",
    coHosts: ["Albanian American Business Assoc.", "WAC Strategy Council"],
    location: "Midtown Manhattan / Virtual",
    time: "6:30 PM - 9:00 PM EST",
    tags: ["Careers", "Business"],
    isSubscribed: false,
  },
  {
    id: "e4",
    date: "2026-05-15",
    day: "15",
    month: "May",
    title: "OriginAL 2026 Cohort Kickoff Meeting",
    coHosts: ["World Albanian Congress", "OriginAL Program", "Germin"],
    location: "Virtual (Zoom)",
    time: "1:00 PM EST",
    tags: ["Travelers", "Youth"],
    isSubscribed: true,
  },
];

export default function MyCalendar() {
  const [view, setView] = useState<"my_calendar" | "all_events">("my_calendar");

  const displayedEvents =
    view === "my_calendar"
      ? MOCK_EVENTS.filter((e) => e.isSubscribed)
      : MOCK_EVENTS;

  return (
    <section className="py-12 px-4 max-w-[75rem] mx-auto w-full">
      {/* CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 p-1 rounded-lg flex items-center">
          <button
            onClick={() => setView("my_calendar")}
            className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all ${
              view === "my_calendar"
                ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
            }`}
          >
            My Organizations
          </button>
          <button
            onClick={() => setView("all_events")}
            className={`px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wider transition-all ${
              view === "all_events"
                ? "bg-[var(--foreground)] text-[var(--background)] shadow-sm"
                : "text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
            }`}
          >
            All Network Events
          </button>
        </div>

        <button className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider border border-[var(--foreground)]/20 px-4 py-2 rounded-lg hover:bg-[var(--foreground)]/5 transition-colors">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* FEED */}
      <div className="space-y-8">
        {displayedEvents.map((event) => (
          <div key={event.id} className="relative group">
            {/* Timeline Connector Line */}
            <div className="absolute top-20 bottom-[-2rem] left-8 w-px bg-[var(--foreground)]/10 group-last:hidden"></div>

            <div className="flex flex-col md:flex-row gap-6 relative z-10">
              {/* DATE BADGE */}
              <div className="w-16 shrink-0 flex flex-col items-center">
                <div className="bg-[var(--accent)] text-white text-center rounded-lg overflow-hidden w-full shadow-lg border border-[var(--foreground)]/10">
                  <div className="text-[10px] uppercase font-bold tracking-widest bg-black/20 py-1">
                    {event.month}
                  </div>
                  <div className="text-2xl font-bold py-1 leading-none">
                    {event.day}
                  </div>
                </div>
              </div>

              {/* EVENT CARD */}
              <div className="flex-1 bg-[var(--background)] border border-[var(--foreground)]/10 rounded-xl p-6 hover:border-[var(--accent)]/50 transition-colors shadow-sm group-hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    {/* CO-HOSTS (Shared Calendar Feature) */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {event.coHosts.map((host, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-[var(--foreground)]/5 text-[var(--foreground)]/70 border border-[var(--foreground)]/10"
                        >
                          <Building2 className="w-3 h-3" /> {host}
                        </span>
                      ))}
                      {event.coHosts.length > 1 && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded border border-[var(--accent)]/20">
                          Co-Hosted
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-[var(--accent)] transition-colors">
                      {event.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-sm opacity-70">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4" /> {event.time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {event.location}
                      </span>
                    </div>
                  </div>

                  <button className="shrink-0 bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--accent)] hover:text-white transition-colors px-6 py-2.5 rounded text-sm font-bold uppercase tracking-wider self-start">
                    RSVP
                  </button>
                </div>

                <div className="pt-4 border-t border-[var(--foreground)]/10 flex items-center justify-between">
                  <div className="flex gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] uppercase font-bold tracking-widest opacity-50"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Subscription indicator */}
                  {event.isSubscribed && (
                    <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4" /> In Your Network
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
