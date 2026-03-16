"use client";

import Link from "next/link";

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

  const displayDate = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const displayTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const locationParts = [event.city, event.state, event.country].filter(
    Boolean,
  );
  const displayLocation =
    locationParts.length > 0 ? locationParts.join(", ") : "Virtual / Global";

  return (
    <Link
      href={`/events/${event.id}`}
      className="wac-card group flex flex-col p-6 transition-transform hover:-translate-y-1 block h-full text-left relative overflow-hidden"
    >
      {isPast && (
        <div className="absolute top-0 right-0 bg-[var(--surface-2)] text-white/50 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg border-b border-l border-[var(--border)] z-10">
          Past Event
        </div>
      )}

      {/* Co-Hosts Avatar Stack */}
      {event.co_hosts && event.co_hosts.length > 0 && (
         <div className="absolute top-4 right-4 flex -space-x-3 z-10" title={`Co-hosted by ${event.co_hosts.map(h => h.name).join(', ')}`}>
            {event.co_hosts.map((host, i) => (
               <div key={host.id} className="w-8 h-8 rounded-full border-2 border-[var(--surface)] bg-[var(--background)] flex items-center justify-center overflow-hidden relative shadow-md" style={{ zIndex: event.co_hosts!.length - i }}>
                  {host.image ? (
                     <img src={host.image} alt={host.name} className="w-full h-full object-cover" />
                  ) : (
                     <span className="text-[10px] font-bold text-amber-500">{host.name.charAt(0)}</span>
                  )}
               </div>
            ))}
         </div>
      )}

      <div className="h-40 rounded-xl bg-amber-500/10 mb-5 flex items-center justify-center border border-amber-500/20 group-hover:border-amber-500/40 transition shrink-0 relative overflow-hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-amber-500/50"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>

      <div className="text-sm font-bold text-amber-500 mb-2 uppercase tracking-widest">
        {displayDate} • {displayTime}
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
        {event.title}
      </h3>

      <div className="mt-auto space-y-3 pt-4">
        <div className="text-sm opacity-60 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate">{displayLocation}</span>
        </div>

        {event.event_type && (
          <div className="flex flex-wrap gap-2">
            <span className="wac-button-chip-primary bg-amber-500/10 border-[var(--border)] text-amber-300 pointer-events-none py-1 px-2.5 text-[10px]">
              {event.event_type}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
