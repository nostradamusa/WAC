"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import EventsResults from "@/components/events/EventsResults";
import SectionLabel from "@/components/ui/SectionLabel";
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

// ── Types ──────────────────────────────────────────────────────────────────────

type Lens = "for-you" | "my-network" | "discover";

// ── Static featured seed events ────────────────────────────────────────────────

const FEATURED: {
  id: string;
  href: string;
  title: string;
  source: string;
  sourceType: "org" | "group";
  date: string;
  time: string;
  location: string;
  networkSignal: string;
}[] = [
  {
    id: "f1",
    href: "/events/albanian-professionals-summer-gala",
    title: "Albanian Professionals Summer Gala",
    source: "Albanian Professionals Association",
    sourceType: "org",
    date: "Jun 21",
    time: "7:00 PM",
    location: "Manhattan, NY",
    networkSignal: "Arben + 14 attending",
  },
  {
    id: "f2",
    href: "/events/wac-annual-leadership-summit",
    title: "WAC Annual Leadership Summit",
    source: "World Albanian Congress",
    sourceType: "org",
    date: "Jul 12",
    time: "9:00 AM",
    location: "Washington, D.C.",
    networkSignal: "22 from your network",
  },
  {
    id: "f3",
    href: "/events/nyc-founders-circle-dinner",
    title: "NYC Founders Circle Dinner",
    source: "Albanian Founders Circle",
    sourceType: "group",
    date: "May 30",
    time: "7:30 PM",
    location: "Brooklyn, NY",
    networkSignal: "Blerina + 8 attending",
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

const LENSES: { id: Lens; label: string; icon: React.ElementType }[] = [
  { id: "for-you",    label: "For You",    icon: Sparkles },
  { id: "my-network", label: "My Network", icon: Network  },
  { id: "discover",   label: "Discover",   icon: Compass  },
];

// ── Featured card ──────────────────────────────────────────────────────────────

function FeaturedCard({ event }: { event: typeof FEATURED[0] }) {
  const SourceIcon = event.sourceType === "org" ? Building2 : Users;

  return (
    <Link
      href={event.href}
      className="wac-card group flex flex-col p-0 overflow-hidden hover:border-white/15 transition-colors h-full"
    >
      {/* Source strip */}
      <div className="px-4 pt-3.5 pb-0 flex items-center gap-1.5">
        <SourceIcon size={11} className="text-white/25 shrink-0" />
        <span className="text-[11px] text-white/30 truncate">{event.source}</span>
      </div>

      {/* Body */}
      <div className="px-4 pt-2 pb-4 flex flex-col flex-1">
        <h3 className="text-sm font-semibold text-white leading-snug mb-2.5 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
          {event.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/40 mb-3">
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
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users size={10} className="text-white/20" />
            <span className="text-[10px] text-white/30">{event.networkSignal}</span>
          </div>
          {/* Tier 1 CTA: gold filled */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="text-[10px] font-bold px-3.5 py-1.5 rounded-full bg-[#D4AF37] text-black hover:bg-[#c9a430] transition-colors"
          >
            RSVP
          </button>
        </div>
      </div>
    </Link>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const [activeLens, setActiveLens] = useState<Lens>("for-you");
  const [activeType, setActiveType] = useState("All");

  const featuredLabel = activeLens === "for-you" ? "Recommended for You" : "From Your Network";
  const browseLabel   = activeLens === "discover" ? "Discover Events" : "All Events";

  return (
    <div className="w-full min-h-screen bg-[var(--background)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-24">

        {/* ── Zone 1: Eyebrow ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-1.5">
          <Calendar size={13} className="text-white/30" strokeWidth={2} />
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-white/40">
            Events
          </span>
        </div>

        {/* ── Zone 2: H1 — matches Directory brand pattern ────────────────── */}
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-white leading-[1.1]">
          The{" "}
          <span className="italic text-[#D4AF37]">Events</span>
        </h1>

        {/* ── Zone 3: Description ─────────────────────────────────────────── */}
        <p className="mt-2 text-sm text-white/50">
          Community events, summits &amp; gatherings
        </p>

        {/* ── Zone 4: Lens control (filled-segment switcher) ──────────────── */}
        {/*
          Mode selector — not a content filter. Neutral white fill on active
          segment. Structurally heavier than the outlined chips below so the
          hierarchy reads: mode first, category second.
        */}
        <div className="mt-5 flex items-center">
          <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.05] border border-white/[0.09] rounded-full">
            {LENSES.map(({ id, label, icon: Icon }) => {
              const active = activeLens === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveLens(id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? "bg-white/[0.12] text-white"
                      : "text-white/45 hover:text-white/70"
                  }`}
                >
                  <Icon size={12} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Zone 5: Category chips (outlined pill — secondary filter) ─────── */}
        {/*
          More breathing room (mt-4) from the lens above — visually separates
          the two control levels so they don't read as one compound control.
        */}
        <div className="relative mt-4">
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            {EVENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
                  activeType === type
                    ? "border-[#D4AF37]/30 bg-[#D4AF37]/[0.08] text-[#D4AF37]/80"
                    : "border-white/[0.12] bg-transparent text-white/55 hover:text-white/80 hover:border-white/18"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--background)] to-transparent" />
        </div>

        {/* ── Featured / recommended section ──────────────────────────────── */}
        {activeLens !== "discover" && (
          <section className="mt-8">
            <SectionLabel label={featuredLabel} variant="featured" className="mb-4" />

            {/*
              Mobile: horizontal scroll rail — fixed-width cards in a wrapper.
              Desktop: 3-column grid — cards stretch to fill the column.
              Same data, two different density treatments.
            */}
            <div
              className="md:hidden flex gap-3 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              {FEATURED.map((ev) => (
                <div key={ev.id} className="shrink-0 w-[272px]">
                  <FeaturedCard event={ev} />
                </div>
              ))}
            </div>

            <div className="hidden md:grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURED.map((ev) => (
                <FeaturedCard key={ev.id} event={ev} />
              ))}
            </div>
          </section>
        )}

        {/* ── Browse / all events section ──────────────────────────────────── */}
        <section className="mt-8">
          {/*
            Section label uses browseLabel only — the active category chip
            above already communicates which type is selected. Concatenating
            "All Events · Networking" in small-caps tracking looks broken.
          */}
          <SectionLabel label={browseLabel} variant="standard" className="mb-4" />
          <Suspense
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="wac-card h-28 animate-pulse" />
                ))}
              </div>
            }
          >
            <EventsResults eventType={activeType !== "All" ? activeType : undefined} />
          </Suspense>
        </section>

      </div>
    </div>
  );
}
