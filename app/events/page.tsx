"use client";

import { Suspense, useState } from "react";
import EventsResults from "@/components/events/EventsResults";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Building2,
  Sparkles,
  Compass,
  Network,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type Lens = "for-you" | "my-network" | "discover";

// ── Static featured seed events ────────────────────────────────────────────

const FEATURED: {
  id: string;
  title: string;
  source: string;
  sourceType: "org" | "group" | "person";
  date: string;
  time: string;
  location: string;
  networkSignal: string;
  type: string;
}[] = [
  {
    id: "f1",
    title: "Albanian Professionals Summer Gala",
    source: "Albanian Professionals Association",
    sourceType: "org",
    date: "Jun 21",
    time: "7:00 PM",
    location: "Manhattan, NY",
    networkSignal: "Arben + 14 attending",
    type: "Networking",
  },
  {
    id: "f2",
    title: "WAC Annual Leadership Summit",
    source: "World Albanian Congress",
    sourceType: "org",
    date: "Jul 12",
    time: "9:00 AM",
    location: "Washington, D.C.",
    networkSignal: "22 from your network",
    type: "Professional",
  },
  {
    id: "f3",
    title: "NYC Founders Circle Dinner",
    source: "Albanian Founders Circle",
    sourceType: "group",
    date: "May 30",
    time: "7:30 PM",
    location: "Brooklyn, NY",
    networkSignal: "Blerina + 8 attending",
    type: "Business",
  },
];

const EVENT_TYPES = [
  "All",
  "Networking",
  "Professional",
  "Family",
  "Youth",
  "Business",
  "Social",
  "Volunteer",
  "Education",
];

const TYPE_COLORS: Record<string, string> = {
  Networking:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  Professional: "text-sky-400 bg-sky-500/10 border-sky-500/25",
  Family:       "text-purple-400 bg-purple-500/10 border-purple-500/25",
  Business:     "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/25",
  Social:       "text-rose-400 bg-rose-500/10 border-rose-500/25",
  Youth:        "text-blue-400 bg-blue-500/10 border-blue-500/25",
  Volunteer:    "text-green-400 bg-green-500/10 border-green-500/25",
  Education:    "text-amber-400 bg-amber-500/10 border-amber-500/25",
};

function typeColor(type: string) {
  return TYPE_COLORS[type] ?? "text-white/40 bg-white/5 border-white/10";
}

// ── Featured event card ────────────────────────────────────────────────────

function FeaturedCard({ event }: { event: (typeof FEATURED)[0] }) {
  const colorClass = typeColor(event.type);
  const SourceIcon = event.sourceType === "org" ? Building2 : Users;

  return (
    <div className="wac-card shrink-0 w-[264px] sm:w-[288px] p-0 overflow-hidden hover:border-white/15 transition-colors cursor-pointer">
      <div className="px-3.5 pt-3 pb-0 flex items-center gap-1.5">
        <SourceIcon size={11} className="text-white/25 shrink-0" />
        <span className="text-[11px] text-white/30 truncate">{event.source}</span>
      </div>
      <div className="px-3.5 pt-2 pb-3">
        <h3 className="text-sm font-semibold text-white leading-snug mb-2 line-clamp-2">
          {event.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/35 mb-2.5">
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {event.date}
          </span>
          <span className="text-white/15">·</span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {event.time}
          </span>
          <span className="text-white/15">·</span>
          <span className="flex items-center gap-1 min-w-0">
            <MapPin size={10} className="shrink-0" />
            <span className="truncate">{event.location}</span>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users size={10} className="text-white/20" />
            <span className="text-[10px] text-white/25">{event.networkSignal}</span>
          </div>
          <button
            className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-colors ${colorClass}`}
          >
            RSVP
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lens definitions ───────────────────────────────────────────────────────

const LENSES: { id: Lens; label: string; icon: React.ElementType }[] = [
  { id: "for-you",    label: "For You",    icon: Sparkles },
  { id: "my-network", label: "My Network", icon: Network  },
  { id: "discover",   label: "Discover",   icon: Compass  },
];

// ── Main page ──────────────────────────────────────────────────────────────

function EventsPageInner() {
  const [activeLens, setActiveLens] = useState<Lens>("for-you");
  const [activeType, setActiveType] = useState("All");

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24">
      <div className="max-w-5xl mx-auto px-4 pt-4 space-y-5">

        {/* ── Lens switcher ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
          {LENSES.map(({ id, label, icon: Icon }) => {
            const active = activeLens === id;
            return (
              <button
                key={id}
                onClick={() => setActiveLens(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide transition whitespace-nowrap ${
                  active
                    ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                    : "text-white/60 border border-transparent hover:text-white"
                }`}
              >
                <Icon size={12} strokeWidth={active ? 2.2 : 1.6} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Featured / network lane ────────────────────────────────────── */}
        {activeLens !== "discover" && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">
                {activeLens === "for-you" ? "Recommended for You" : "From Your Network"}
              </p>
              <button className="text-[10px] text-white/25 hover:text-white/50 transition">
                View all
              </button>
            </div>
            <div
              className="flex gap-2.5 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              {FEATURED.map((ev) => (
                <FeaturedCard key={ev.id} event={ev} />
              ))}
            </div>
          </section>
        )}

        {/* ── Type chips — secondary filter ──────────────────────────────── */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors whitespace-nowrap ${
                activeType === type
                  ? "text-[#D4AF37]/80 border-[#D4AF37]/25 bg-[#D4AF37]/[0.06]"
                  : "text-white/28 border-white/[0.06] hover:text-white/50 hover:border-white/[0.11]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* ── Events from DB ─────────────────────────────────────────────── */}
        <section className="space-y-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/20">
            {activeLens === "discover" ? "Discover Events" : "All Events"}
            {activeType !== "All" && (
              <span className="text-white/15 font-normal normal-case tracking-normal ml-1.5">
                — {activeType}
              </span>
            )}
          </p>
          <Suspense
            fallback={
              <div className="grid gap-3 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="wac-card h-24 animate-pulse" />
                ))}
              </div>
            }
          >
            <EventsResults
              eventType={activeType !== "All" ? activeType : undefined}
            />
          </Suspense>
        </section>

      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <main className="pt-14 md:pt-16">
      <Suspense fallback={<div className="min-h-screen animate-pulse" />}>
        <EventsPageInner />
      </Suspense>
    </main>
  );
}
