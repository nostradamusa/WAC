"use client";

import Link from "next/link";
import { Calendar, MapPin, Clock, Users, Building2 } from "lucide-react";

export interface EventEntry {
  id: string;
  title: string;
  description: string | null;
  organization_id: string | null;
  location_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  start_time: string;
  end_time: string;
  event_type: string | null;
  visibility: string;
  co_hosts?: { name: string; image?: string; id: string }[];
}

export default function EventCard({ event }: { event: EventEntry }) {
  const startDate = new Date(event.start_time);
  const isPast = new Date() > new Date(event.end_time);

  const monthStr = startDate.toLocaleDateString("en-US", { month: "short" });
  const dayStr   = startDate.getDate();

  // Weekday + date gives temporal context the date block doesn't provide
  const dateDisplay = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const timeStr = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const locationParts = [event.city, event.state].filter(Boolean);
  const displayLocation =
    locationParts.length > 0 ? locationParts.join(", ") : event.country || "Virtual";

  const sourceLabel =
    event.co_hosts?.length
      ? `By ${event.co_hosts[0].name}${event.co_hosts.length > 1 ? ` + ${event.co_hosts.length - 1} more` : ""}`
      : event.organization_id
      ? "Official Organization Event"
      : "WAC Community Event";

  const SourceIcon = event.organization_id ? Building2 : Users;

  return (
    <Link
      href={`/events/${event.id}`}
      className={`wac-card group flex flex-col p-0 overflow-hidden hover:border-white/15 transition-colors ${isPast ? "opacity-55" : ""}`}
    >
      {/* Source strip */}
      <div className="px-4 pt-3.5 pb-0 flex items-center gap-1.5">
        <SourceIcon size={11} className="text-white/25 shrink-0" />
        <span className="text-[11px] text-white/30 truncate">{sourceLabel}</span>
        {isPast && (
          <span className="ml-auto shrink-0 text-[9px] font-bold uppercase tracking-wider text-white/20 bg-white/[0.04] border border-white/[0.07] px-1.5 py-0.5 rounded-full">
            Past
          </span>
        )}
      </div>

      {/* Main row: date block + title/meta + RSVP */}
      <div className="px-4 pt-2.5 pb-3.5 flex items-start gap-3">
        {/* Date block — teal (Events section-identity color) */}
        <div className="shrink-0 w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex flex-col items-center justify-center">
          <span className="text-[9px] uppercase font-bold tracking-wide text-teal-400/60 leading-none mb-0.5">
            {monthStr}
          </span>
          <span className="text-lg font-black text-teal-400 leading-none">{dayStr}</span>
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white leading-snug mb-1 group-hover:text-[#D4AF37] transition-colors line-clamp-2">
            {event.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/40">
            {/* Date with weekday gives temporal context (is this next weekend?) */}
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {dateDisplay}
            </span>
            <span className="text-white/15">·</span>
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {timeStr}
            </span>
            {displayLocation && (
              <>
                <span className="text-white/15">·</span>
                <span className="flex items-center gap-1 min-w-0">
                  <MapPin size={10} className="shrink-0" />
                  <span className="truncate">{displayLocation}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* RSVP — Tier 1: gold filled. stopPropagation prevents card navigation. */}
        {!isPast && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="shrink-0 mt-0.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-[#D4AF37] text-black hover:bg-[#c9a430] transition-colors"
          >
            RSVP
          </button>
        )}
      </div>

      {/* Footer: co-hosts or event type */}
      {(event.event_type || (event.co_hosts && event.co_hosts.length > 1)) && (
        <div className="px-4 pb-3.5 border-t border-white/[0.05] flex items-center justify-between pt-2.5">
          {event.co_hosts && event.co_hosts.length > 1 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {event.co_hosts.slice(0, 3).map((host, i) => (
                  <div
                    key={host.id}
                    className="w-5 h-5 rounded-full border border-[var(--background)] bg-white/10 flex items-center justify-center text-[9px] font-bold text-white/50 overflow-hidden"
                    style={{ zIndex: 3 - i }}
                  >
                    {host.image ? (
                      <img src={host.image} alt={host.name} className="w-full h-full object-cover" />
                    ) : (
                      host.name.charAt(0)
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-white/25">
                {event.co_hosts.length} co-hosts
              </span>
            </div>
          ) : (
            <span />
          )}

          {event.event_type && (
            <span className="text-[10px] text-white/45 bg-white/[0.06] border border-white/[0.10] px-2 py-0.5 rounded-full ml-auto">
              {event.event_type}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
