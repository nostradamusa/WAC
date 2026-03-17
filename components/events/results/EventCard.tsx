import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { EventDirectoryEntry } from "@/lib/types/event-directory";

export default function EventCard({
  event,
}: {
  event: EventDirectoryEntry;
}) {
  const locationParts = [event.city, event.state, event.country].filter(Boolean);
  const locationString = locationParts.length > 0 ? locationParts.join(", ") : "Global / Digital";

  // Dummy date parsing for the card icon
  const dateObj = new Date(event.date);
  const monthString = dateObj.toLocaleDateString("en-US", { month: "short" }) || "TBD";
  const dayString = dateObj.getDate() || "--";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="wac-card group flex flex-col justify-between p-6 transition hover:border-[var(--border)] hover:bg-[rgba(255,255,255,0.02)] h-full min-h-[300px]"
    >
      <div>
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-14 w-14 flex-col shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:bg-rose-500/20 transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-widest leading-none mt-1">{monthString}</span>
            <span className="text-xl font-black leading-none mt-1">{dayString}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 w-full">
              <h3 className="text-lg sm:text-xl font-bold group-hover:text-[var(--accent)] transition-colors line-clamp-2">
                {event.name}
              </h3>
            </div>

            <p className="text-sm font-medium flex items-center gap-1.5 mt-2 text-[#D4AF37]">
              <CalendarDays size={14} />
              {event.date} • {event.time}
            </p>
            
            <p className="text-xs sm:text-sm opacity-60 flex items-center gap-1.5 mt-1.5 truncate">
              <MapPin size={14} className="shrink-0" />
              <span className="truncate">{event.location} - {locationString}</span>
            </p>
          </div>
        </div>

        <p className="text-[14px] opacity-80 leading-relaxed line-clamp-4 mt-4">
          {event.description}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-400 border border-rose-500/30">
            Event
          </span>
        </div>

        {event.attendees_count > 0 && (
          <div className="text-xs font-medium text-white/50 flex items-center gap-1.5">
            <Users size={14} />
            {event.attendees_count} attending
          </div>
        )}
      </div>
    </Link>
  );
}
