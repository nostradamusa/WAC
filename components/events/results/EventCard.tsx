import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { EventDirectoryEntry } from "@/lib/types/event-directory";

export default function EventCard({ event }: { event: EventDirectoryEntry }) {
  const locationParts = [event.city, event.state, event.country].filter(Boolean);
  const locationString = locationParts.length > 0 ? locationParts.join(", ") : "Global / Digital";

  // Parse date components directly to avoid UTC midnight timezone offset bug.
  // new Date("2026-10-15") is UTC midnight — getDate() returns the wrong day
  // for users in UTC-offset timezones. Parsing the parts avoids this entirely.
  const [yearStr, monthStr, dayStr] = event.date.split("-");
  const year  = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed for Date constructor
  const day   = parseInt(dayStr, 10);
  const dateLocal   = new Date(year, month, day);
  const monthString = dateLocal.toLocaleDateString("en-US", { month: "short" });

  return (
    <Link
      href={`/events/${event.slug}`}
      className="wac-card group flex flex-col p-0 overflow-hidden hover:border-white/15 transition-colors h-full"
    >
      {/* Header: date block + title/meta */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        {/* Date block — teal (Events section-identity color) */}
        <div className="shrink-0 w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex flex-col items-center justify-center">
          <span className="text-[9px] uppercase font-bold tracking-wide text-teal-400/60 leading-none mb-0.5">
            {monthString}
          </span>
          <span className="text-lg font-black text-teal-400 leading-none">{day}</span>
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold text-white leading-snug mb-1.5 group-hover:text-[#b08d57] transition-colors line-clamp-2">
            {event.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/40">
            <span className="flex items-center gap-1">
              <CalendarDays size={10} />
              {event.date}
              {event.time && <> · {event.time}</>}
            </span>
            {locationString && (
              <>
                <span className="text-white/15">·</span>
                <span className="flex items-center gap-1 min-w-0">
                  <MapPin size={10} className="shrink-0" />
                  <span className="truncate">{locationString}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <p className="px-4 pb-3 text-xs text-white/45 leading-relaxed line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto px-4 pb-3.5 border-t border-white/[0.05] pt-2.5 flex items-center justify-between">
        <span className="text-[10px] text-teal-400/70 bg-teal-500/[0.08] border border-teal-500/20 px-2.5 py-0.5 rounded-full">
          Event
        </span>
        {event.attendees_count > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-white/35">
            <Users size={11} />
            <span>{event.attendees_count} attending</span>
          </div>
        )}
      </div>
    </Link>
  );
}
