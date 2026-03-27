"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import EventCard, { EventEntry } from "@/components/events/EventCard";

export default function OrganizationEventsTab({
  organizationId,
}: {
  organizationId: string;
}) {
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrgEvents() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("status", "published")
          .in("display_mode", ["calendar", "both"])
          .or(`and(source_type.eq.organization,source_id.eq.${organizationId}),organization_id.eq.${organizationId},and(host_entity_type.eq.organization,host_entity_id.eq.${organizationId}),and(linked_entity_type.eq.organization,linked_entity_id.eq.${organizationId})`)
          .order("start_time", { ascending: true });

        if (error) throw error;
        setEvents(data as EventEntry[]);
      } catch (err) {
        console.error("Failed to load org events", err);
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchOrgEvents();
    }
  }, [organizationId]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-500">
        {[1, 2].map((i) => (
          <div key={i} className="wac-card h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-24 opacity-50 animate-in fade-in duration-500">
        <h3 className="text-xl font-medium mb-2">Upcoming Events</h3>
        <p>No public events scheduled currently.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-500">
      {events.map((ev) => (
        <EventCard key={ev.id} event={ev} />
      ))}
    </div>
  );
}
