"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EventCard, { EventEntry } from "./EventCard";

function EventsResultsInner() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.toLowerCase() || "";

  const [events, setEvents] = useState<EventEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      try {
        // We call the PostGIS proximity scoring RPC
        // For a real production app, we would pass p_user_lat and p_user_lng from geolocation
        const { data, error: sbError } = await supabase.rpc("get_events_scored", {
          p_search_query: q || null,
          p_user_lat: null, 
          p_user_lng: null
        });

        if (sbError) throw sbError;

        // The RPC returns data already sorted by relevance and time
        const eventData = (data as any[]) || [];
        setEvents(eventData as EventEntry[]);
      } catch (err: any) {
        console.error("Error fetching events:", JSON.stringify(err, null, 2), err.message || err);
        setError(`Failed to load events. ${err.message || ''}`);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [q]);
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="wac-card p-6 h-64 animate-pulse flex flex-col justify-between rounded-2xl"
          />
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
      <div className="text-center py-24 border border-dashed border-[var(--border)] rounded-3xl bg-[var(--surface)]/50">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-6 border border-emerald-500/20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-3">No events found</h3>
        <p className="opacity-60 max-w-sm mx-auto text-sm">
          There are currently no events matching your filters. Try adjusting
          your search or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((ev) => (
        <EventCard key={ev.id} event={ev} />
      ))}
    </div>
  );
}

export default function EventsResults() {
  return (
    <Suspense fallback={
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="wac-card p-6 h-64 animate-pulse flex flex-col justify-between rounded-2xl"
          />
        ))}
      </div>
    }>
      <EventsResultsInner />
    </Suspense>
  );
}
