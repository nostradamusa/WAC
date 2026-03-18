"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EventCard, { EventEntry } from "./EventCard";

interface EventsResultsProps {
  eventType?: string;
}

function EventsResultsInner({ eventType }: EventsResultsProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [events, setEvents] = useState<EventEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: sbError } = await supabase.rpc("get_events_scored", {
          p_search_query: searchQuery || null,
          p_user_lat: null,
          p_user_lng: null,
        });

        if (sbError) throw sbError;

        let eventData = (data as any[]) || [];

        // Client-side filter by event type when provided
        if (eventType) {
          eventData = eventData.filter(
            (e: any) => e.event_type?.toLowerCase() === eventType.toLowerCase()
          );
        }

        setEvents(eventData as EventEntry[]);
      } catch (err: any) {
        console.error("Error fetching events:", err);
        setError(`Failed to load events. ${err.message || ""}`);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [searchQuery, eventType]);

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="wac-card h-24 animate-pulse" />
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
    <div className="grid gap-3 md:grid-cols-2">
      {events.map((ev) => (
        <EventCard key={ev.id} event={ev} />
      ))}
    </div>
  );
}

export default function EventsResults({ eventType }: EventsResultsProps) {
  return <EventsResultsInner eventType={eventType} />;
}
