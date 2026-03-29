"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EventCard, { EventDisplayMode, EventEntry, EventSourceType, EventStatus, EventType } from "./EventCard";

interface EventsResultsProps {
  eventType?: string;
  upcoming?:  boolean;
  limit?:     number;
  categories?: string[];
  formats?: string[];
  datePreset?: string | null;
  sources?: string[];
  audiences?: string[];
  sortBy?: string;
}

const NORMALIZED_EVENT_TYPES: EventType[] = ["event", "announcement", "feature_drop", "alert"];

type EventRow = EventEntry & {
  source_type: EventSourceType;
  source_id: string | null;
  display_mode: EventDisplayMode;
  status: EventStatus;
  event_type: EventType | null;
  access_mode: string | null;
  capacity: number | null;
};

type EventRsvpRow = {
  event_id: string;
  status: "going" | "interested" | "not_going";
  approval_status: "approved" | "pending" | "declined" | "waitlisted";
  user_id: string;
};

function EventsResultsInner({ eventType, upcoming, limit, categories, formats, datePreset, sources, audiences, sortBy }: EventsResultsProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [events, setEvents] = useState<EventEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Determine sort column and direction
        const sortCol = sortBy === "Popular" ? "attending_count" : "start_time";
        const sortAsc = sortBy === "Soonest" || sortBy === "Relevant" || !sortBy;

        let query = supabase
          .from("events")
          .select("id, title, description, source_type, source_id, display_mode, status, organization_id, host_entity_type, host_entity_id, linked_entity_type, linked_entity_id, hosting_metadata, location_name, city, state, country, start_time, end_time, event_type, visibility, access_mode, capacity, category, format, audience")
          .eq("status", "published")
          .in("display_mode", ["calendar", "both"])
          .order(sortCol, { ascending: sortAsc });

        if (searchQuery.trim()) {
          query = query.or(
            `title.ilike.%${searchQuery.trim()}%,description.ilike.%${searchQuery.trim()}%,city.ilike.%${searchQuery.trim()}%,location_name.ilike.%${searchQuery.trim()}%`
          );
        }

        if (upcoming) {
          query = query.gte("start_time", new Date().toISOString());
        }

        if (eventType && NORMALIZED_EVENT_TYPES.includes(eventType as EventType)) {
          query = query.ilike("event_type", eventType);
        }

        // Category filter
        if (categories && categories.length > 0) {
          query = query.in("category", categories.map((c) => c.toLowerCase()));
        }

        // Format filter — map UI labels to DB values
        if (formats && formats.length > 0) {
          const dbFormats = formats.map((f) =>
            f === "In Person" ? "in_person" : f.toLowerCase()
          );
          query = query.in("format", dbFormats);
        }

        // Date preset filter
        if (datePreset) {
          const now = new Date();
          let start: Date | null = null;
          let end: Date | null = null;

          if (datePreset === "Today") {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = new Date(start);
            end.setDate(end.getDate() + 1);
          } else if (datePreset === "This Week") {
            const day = now.getDay();
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
            end = new Date(start);
            end.setDate(end.getDate() + 7);
          } else if (datePreset === "This Weekend") {
            const day = now.getDay();
            const satOffset = day <= 6 ? 6 - day : 0;
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + satOffset);
            end = new Date(start);
            end.setDate(end.getDate() + 2);
          } else if (datePreset === "This Month") {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          }

          if (start) query = query.gte("start_time", start.toISOString());
          if (end) query = query.lt("start_time", end.toISOString());
        }

        // Source filter — map UI labels to DB source_type values
        if (sources && sources.length > 0) {
          const sourceMap: Record<string, string> = {
            "WAC": "wac",
            "My Network": "wac",
            "Groups": "group",
            "Organizations": "organization",
            "Businesses": "business",
          };
          const dbSources = [...new Set(sources.map((s) => sourceMap[s]).filter(Boolean))];
          if (dbSources.length > 0) {
            query = query.in("source_type", dbSources);
          }
          // "Public" source means visibility = public
          if (sources.includes("Public")) {
            query = query.eq("visibility", "public");
          }
        }

        // Audience filter
        if (audiences && audiences.length > 0) {
          query = query.in("audience", audiences.map((a) => a.toLowerCase()));
        }

        const { data: eventRows, error: eventsError } = await query.limit(limit ?? 60);
        if (eventsError) throw eventsError;

        const rows = (eventRows ?? []) as EventRow[];
        const eventIds = rows.map((event) => event.id);

        let rsvpRows: EventRsvpRow[] = [];
        if (eventIds.length > 0) {
          const { data: rsvpData, error: rsvpError } = await supabase
            .from("event_rsvps")
            .select("event_id, status, approval_status, user_id")
            .in("event_id", eventIds);

          if (rsvpError) throw rsvpError;
          rsvpRows = (rsvpData ?? []) as EventRsvpRow[];
        }

        const attendeeCountByEvent = new Map<string, number>();
        const currentUserRsvpByEvent = new Map<string, EventRsvpRow>();

        for (const rsvp of rsvpRows) {
          if (rsvp.status === "going" && rsvp.approval_status !== "declined" && rsvp.approval_status !== "waitlisted") {
            attendeeCountByEvent.set(
              rsvp.event_id,
              (attendeeCountByEvent.get(rsvp.event_id) ?? 0) + 1
            );
          }

          if (user?.id && rsvp.user_id === user.id) {
            currentUserRsvpByEvent.set(rsvp.event_id, rsvp);
          }
        }

        const mappedEvents: EventEntry[] = rows.map((event) => {
          const currentUserRsvp = currentUserRsvpByEvent.get(event.id);
          return {
            ...event,
            attending_count: attendeeCountByEvent.get(event.id) ?? 0,
            current_user_rsvp_status: currentUserRsvp?.status ?? null,
            current_user_approval_status: currentUserRsvp?.approval_status ?? null,
          };
        });

        if (!cancelled) {
          setEvents(mappedEvents);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          console.error("Error fetching events:", err);
          setError(
            `Failed to load events.${err instanceof Error && err.message ? ` ${err.message}` : ""}`
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchEvents();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, eventType, upcoming, limit, JSON.stringify(categories), JSON.stringify(formats), datePreset, JSON.stringify(sources), JSON.stringify(audiences), sortBy]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="wac-card h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="wac-card p-12 text-center text-red-400 border-red-500/20">
        <p>{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-16 text-center space-y-2 border border-dashed border-white/[0.07] rounded-2xl">
        <p className="text-white/40 text-sm">No events found.</p>
        <p className="text-white/25 text-xs">Try adjusting your search or check back later.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((ev) => (
        <EventCard key={ev.id} event={ev} />
      ))}
    </div>
  );
}

export default function EventsResults(props: EventsResultsProps) {
  return <EventsResultsInner {...props} />;
}
