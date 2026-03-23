"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, Globe, MapPin, Minus, Plus, Users } from "lucide-react";
import PremiumSelect from "@/components/ui/PremiumSelect";
import { supabase } from "@/lib/supabase";
import { normalizeEventHostingMetadata } from "@/lib/events/hosting";

type EventQuestion = {
  id: string;
  question_text: string;
  question_type: "text" | "yesno" | "choice";
  is_required: boolean;
  sort_order: number;
};

type EventDetail = {
  id: string;
  title: string;
  description: string | null;
  organization_id: string | null;
  host_entity_type: "organization" | "business" | "group" | null;
  host_entity_id: string | null;
  linked_entity_type: "organization" | "business" | "group" | null;
  linked_entity_id: string | null;
  hosting_metadata: unknown;
  start_time: string;
  end_time: string;
  location: string | null;
  location_name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  event_type: string | null;
  virtual_link: string | null;
  cover_image_url: string | null;
  visibility: string;
  rsvp_enabled: boolean;
  access_mode: string;
  requires_approval: boolean;
  capacity: number | null;
  waitlist_enabled: boolean;
  allow_plus_ones: boolean;
  require_guest_names: boolean;
  created_by: string | null;
};

type EventRsvp = {
  status: "going" | "interested" | "not_going";
  approval_status: "approved" | "pending" | "declined" | "waitlisted";
  guest_count: number;
  guest_names: string[];
  rsvp_answers: Record<string, string>;
};

type HostRsvpEntry = EventRsvp & {
  id: string;
  user_id: string;
  created_at: string;
  profile: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

function isCountedRsvp(entry: Pick<EventRsvp, "status" | "approval_status">) {
  return entry.status === "going" && entry.approval_status !== "declined" && entry.approval_status !== "waitlisted";
}

function getHostPrimaryActionLabel(entry: Pick<EventRsvp, "status" | "approval_status">) {
  if (entry.status !== "going") return null;
  if (entry.approval_status === "waitlisted") return "Promote";
  if (entry.approval_status === "pending") return "Approve";
  if (entry.approval_status === "declined") return "Approve";
  return null;
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [questions, setQuestions] = useState<EventQuestion[]>([]);
  const [rsvp, setRsvp] = useState<EventRsvp | null>(null);
  const [goingCount, setGoingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(1);
  const [guestNames, setGuestNames] = useState<string[]>([""]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hostRsvps, setHostRsvps] = useState<HostRsvpEntry[]>([]);
  const [hostActionUserId, setHostActionUserId] = useState<string | null>(null);
  const [hostSearchQuery, setHostSearchQuery] = useState("");
  const [hostSectionFilter, setHostSectionFilter] = useState<"all" | "approved" | "pending" | "waitlisted" | "interested" | "inactive">("all");

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      setLoading(true);
      setError(null);

      try {
        const [{ data: eventData, error: eventError }, { data: questionsData, error: questionsError }, { count, error: rsvpCountError }, { data: authData }] = await Promise.all([
          supabase
            .from("events")
            .select("id, title, description, organization_id, host_entity_type, host_entity_id, linked_entity_type, linked_entity_id, hosting_metadata, start_time, end_time, location, location_name, city, state, country, event_type, virtual_link, cover_image_url, visibility, rsvp_enabled, access_mode, requires_approval, capacity, waitlist_enabled, allow_plus_ones, require_guest_names, created_by")
            .eq("id", resolvedParams.id)
            .single(),
          supabase
            .from("event_questions")
            .select("id, question_text, question_type, is_required, sort_order")
            .eq("event_id", resolvedParams.id)
            .order("sort_order", { ascending: true }),
          supabase
            .from("event_rsvps")
            .select("id", { count: "exact", head: true })
            .eq("event_id", resolvedParams.id)
            .eq("status", "going")
            .neq("approval_status", "declined")
            .neq("approval_status", "waitlisted"),
          supabase.auth.getUser(),
        ]);

        if (eventError) throw eventError;
        if (questionsError) throw questionsError;
        if (rsvpCountError) throw rsvpCountError;

        let currentRsvp: EventRsvp | null = null;
        const userId = authData.user?.id;
        setCurrentUserId(userId ?? null);
        if (userId) {
          const { data: rsvpData, error: rsvpError } = await supabase
            .from("event_rsvps")
            .select("status, approval_status, guest_count, guest_names, rsvp_answers")
            .eq("event_id", resolvedParams.id)
            .eq("user_id", userId)
            .maybeSingle();

          if (rsvpError) throw rsvpError;
          currentRsvp = (rsvpData as EventRsvp | null) ?? null;
        }

        let hostEntries: HostRsvpEntry[] = [];
        if (userId && eventData.created_by === userId) {
          const { data: rsvpRows, error: hostRsvpError } = await supabase
            .from("event_rsvps")
            .select("id, user_id, status, approval_status, guest_count, guest_names, rsvp_answers, created_at")
            .eq("event_id", resolvedParams.id)
            .order("created_at", { ascending: false });

          if (hostRsvpError) throw hostRsvpError;

          const userIds = Array.from(new Set((rsvpRows ?? []).map((row) => row.user_id)));
          const { data: profilesData, error: profilesError } = userIds.length
            ? await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", userIds)
            : { data: [], error: null };

          if (profilesError) throw profilesError;

          const profilesMap = new Map(
            (profilesData ?? []).map((profile) => [profile.id, profile])
          );

          hostEntries = (rsvpRows ?? []).map((row) => ({
            ...(row as Omit<HostRsvpEntry, "profile">),
            guest_names: row.guest_names ?? [],
            rsvp_answers: (row.rsvp_answers as Record<string, string> | null) ?? {},
            profile: profilesMap.get(row.user_id) ?? null,
          }));
        }

        if (!cancelled) {
          setEvent(eventData as EventDetail);
          setQuestions((questionsData ?? []) as EventQuestion[]);
          setGoingCount(count ?? 0);
          setRsvp(currentRsvp);
          const existingGuestCount = currentRsvp?.guest_count ?? 1;
          const existingGuestNames = currentRsvp?.guest_names?.length
            ? currentRsvp.guest_names
            : Array.from({ length: existingGuestCount }, () => "");
          setGuestCount(existingGuestCount);
          setGuestNames(existingGuestNames);
          setQuestionAnswers(currentRsvp?.rsvp_answers ?? {});
          setHostRsvps(hostEntries);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load this event.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEvent();
    return () => {
      cancelled = true;
    };
  }, [resolvedParams.id]);

  async function refreshEventRsvpState() {
    if (!event) return;

    const [{ count, error: countError }, hostEntriesResult] = await Promise.all([
      supabase
        .from("event_rsvps")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("status", "going")
        .neq("approval_status", "declined")
        .neq("approval_status", "waitlisted"),
      currentUserId && event.created_by === currentUserId
        ? supabase
            .from("event_rsvps")
            .select("id, user_id, status, approval_status, guest_count, guest_names, rsvp_answers, created_at")
            .eq("event_id", event.id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (countError) throw countError;
    setGoingCount(count ?? 0);

    if (hostEntriesResult.error) throw hostEntriesResult.error;

    if (currentUserId && event.created_by === currentUserId) {
      const rsvpRows = hostEntriesResult.data ?? [];
      const userIds = Array.from(new Set(rsvpRows.map((row) => row.user_id)));
      const { data: profilesData, error: profilesError } = userIds.length
        ? await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", userIds)
        : { data: [], error: null };

      if (profilesError) throw profilesError;

      const profilesMap = new Map((profilesData ?? []).map((profile) => [profile.id, profile]));
      const hostEntries: HostRsvpEntry[] = rsvpRows.map((row) => ({
        ...(row as Omit<HostRsvpEntry, "profile">),
        guest_names: row.guest_names ?? [],
        rsvp_answers: (row.rsvp_answers as Record<string, string> | null) ?? {},
        profile: profilesMap.get(row.user_id) ?? null,
      }));

      setHostRsvps(hostEntries);
    }
  }

  async function handleRsvp(status: "going" | "interested" | "not_going") {
    if (!event?.rsvp_enabled) return;

    const normalizedGuestCount =
      status === "going"
        ? event.allow_plus_ones
          ? Math.max(guestCount, 1)
          : 1
        : 1;
    const normalizedGuestNames =
      status === "going"
        ? Array.from({ length: normalizedGuestCount }, (_, index) => guestNames[index] ?? "").map((name) => name.trim())
        : [];
    const normalizedAnswers = status === "going" ? questionAnswers : {};

    if (event.require_guest_names && status === "going" && normalizedGuestNames.some((name) => !name)) {
      setError("Please provide a name for each guest.");
      return;
    }

    for (const question of questions) {
      if (question.is_required && status === "going" && !questionAnswers[question.id]?.trim()) {
        setError(`Please answer: ${question.question_text}`);
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be signed in to RSVP.");
      }

      const approvalStatus =
        status === "going"
          ? event.waitlist_enabled && remainingSpots !== null && remainingSpots <= 0
            ? "waitlisted"
            : event.requires_approval
            ? "pending"
            : "approved"
          : "approved";

      const { error: upsertError } = await supabase.from("event_rsvps").upsert(
        {
          event_id: event.id,
          user_id: user.id,
          status,
          approval_status: approvalStatus,
          guest_count: normalizedGuestCount,
          guest_names: normalizedGuestNames,
          rsvp_answers: normalizedAnswers,
        },
        { onConflict: "event_id,user_id" }
      );

      if (upsertError) {
        throw upsertError;
      }

      const previousCounted = rsvp ? isCountedRsvp(rsvp) : false;
      const nextCounted = isCountedRsvp({ status, approval_status: approvalStatus });
      setRsvp({
        status,
        approval_status: approvalStatus,
        guest_count: normalizedGuestCount,
        guest_names: normalizedGuestNames,
        rsvp_answers: normalizedAnswers,
      });

      if (!previousCounted && nextCounted) {
        setGoingCount((count) => count + 1);
      } else if (previousCounted && !nextCounted) {
        setGoingCount((count) => Math.max(0, count - 1));
      }

      await refreshEventRsvpState();

      setSuccess(
        approvalStatus === "waitlisted"
          ? "You're on the waitlist for this event."
          : approvalStatus === "pending"
          ? "RSVP received. This event requires host approval."
          : status === "going"
          ? "You're confirmed for this event."
          : status === "interested"
          ? "You're marked as interested."
          : "You're no longer attending."
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update RSVP.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleHostApproval(userId: string, approvalStatus: "approved" | "declined" | "waitlisted") {
    if (!event) return;

    const currentEntry = hostRsvps.find((entry) => entry.user_id === userId) ?? null;
    const wasWaitlisted = currentEntry?.approval_status === "waitlisted";
    setHostActionUserId(userId);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from("event_rsvps")
        .update({ approval_status: approvalStatus })
        .eq("event_id", event.id)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      await refreshEventRsvpState();

      setSuccess(
        approvalStatus === "approved"
          ? wasWaitlisted
            ? "Waitlisted attendee promoted."
            : "RSVP approved."
          : approvalStatus === "waitlisted"
          ? "Attendee moved to the waitlist."
          : "RSVP declined."
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update RSVP approval.");
    } finally {
      setHostActionUserId(null);
    }
  }

  if (loading) {
    return (
      <div className="wac-page pb-24 pt-24 md:pt-32">
        <div className="wac-card p-12 text-center opacity-70">Loading event...</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="wac-page pb-24 pt-24 md:pt-32">
        <div className="wac-card p-12 text-center text-red-400 border-red-500/20">{error}</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="wac-page pb-24 pt-24 md:pt-32">
        <div className="wac-card p-12 text-center opacity-70">Event not found.</div>
      </div>
    );
  }

  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const displayDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const displayTime = `${startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  const locationParts = [
    event.location_name || event.location,
    [event.city, event.state].filter(Boolean).join(", "),
    event.country,
  ].filter(Boolean);
  const hosting = normalizeEventHostingMetadata(event.hosting_metadata);
  const displayLocation = locationParts.join(" · ");
  const remainingSpots =
    event.capacity !== null ? Math.max(event.capacity - goingCount, 0) : null;
  const isHost = !!currentUserId && event.created_by === currentUserId;
  const maxGuestCount = Math.max(1, event.capacity ?? 12);
  const rsvpStateLabel = !rsvp
    ? null
    : rsvp.status === "not_going"
    ? "Not Going"
    : rsvp.approval_status === "waitlisted"
    ? "Waitlisted"
    : rsvp.approval_status === "declined"
    ? "Declined by Host"
    : rsvp.status === "going"
    ? rsvp.approval_status === "pending"
      ? "Pending Approval"
      : "Going"
    : "Interested";
  const isGoingLocked = rsvp?.status === "going" && rsvp.approval_status !== "declined";
  const primaryRsvpLabel = isSubmitting
    ? "Processing..."
    : rsvp?.status === "going"
    ? rsvp.approval_status === "pending"
      ? "RSVP Pending Approval"
      : rsvp.approval_status === "waitlisted"
      ? "You're Waitlisted"
      : rsvp.approval_status === "declined"
      ? "Request RSVP Again"
      : "You're Going"
    : "RSVP - Going";
  const normalizedHostSearch = hostSearchQuery.trim().toLowerCase();
  const filteredHostRsvps = hostRsvps.filter((entry) => {
    if (!normalizedHostSearch) return true;

    const searchableValues = [
      entry.profile?.full_name,
      entry.profile?.username,
      entry.status,
      entry.approval_status,
      ...entry.guest_names,
      ...Object.values(entry.rsvp_answers),
    ]
      .filter(Boolean)
      .map((value) => value!.toLowerCase());

    return searchableValues.some((value) => value.includes(normalizedHostSearch));
  });
  const hostRsvpSections = [
    {
      key: "approved",
      title: "Approved Attendees",
      entries: filteredHostRsvps.filter((entry) => entry.status === "going" && entry.approval_status === "approved"),
    },
    {
      key: "pending",
      title: "Pending Approval",
      entries: filteredHostRsvps.filter((entry) => entry.status === "going" && entry.approval_status === "pending"),
    },
    {
      key: "waitlisted",
      title: "Waitlist",
      entries: filteredHostRsvps.filter((entry) => entry.status === "going" && entry.approval_status === "waitlisted"),
    },
    {
      key: "interested",
      title: "Interested",
      entries: filteredHostRsvps.filter((entry) => entry.status === "interested"),
    },
    {
      key: "inactive",
      title: "Declined / Not Going",
      entries: filteredHostRsvps.filter((entry) => entry.approval_status === "declined" || entry.status === "not_going"),
    },
  ]
    .filter((section) => hostSectionFilter === "all" || section.key === hostSectionFilter)
    .filter((section) => section.entries.length > 0);
  const visibleHostRsvpCount = hostRsvpSections.reduce((sum, section) => sum + section.entries.length, 0);
  const hostFilterOptions: Array<{ key: "all" | "approved" | "pending" | "waitlisted" | "interested" | "inactive"; label: string; count: number }> = [
    { key: "all", label: "All", count: filteredHostRsvps.length },
    { key: "approved", label: "Approved", count: filteredHostRsvps.filter((entry) => entry.status === "going" && entry.approval_status === "approved").length },
    { key: "pending", label: "Pending", count: filteredHostRsvps.filter((entry) => entry.status === "going" && entry.approval_status === "pending").length },
    { key: "waitlisted", label: "Waitlist", count: filteredHostRsvps.filter((entry) => entry.status === "going" && entry.approval_status === "waitlisted").length },
    { key: "interested", label: "Interested", count: filteredHostRsvps.filter((entry) => entry.status === "interested").length },
    { key: "inactive", label: "Inactive", count: filteredHostRsvps.filter((entry) => entry.approval_status === "declined" || entry.status === "not_going").length },
  ];
  const hostDisplayName =
    hosting.host_entity?.name ||
    hosting.primary_host?.name ||
    (event.organization_id ? "Official organization host" : "WAC member host");
  const representativeName =
    hosting.representative?.name && hosting.representative.name !== hostDisplayName
      ? hosting.representative.name
      : null;

  function updateGuestCount(nextCount: number) {
    const normalizedCount = Math.max(1, Math.min(maxGuestCount, nextCount));
    setGuestCount(normalizedCount);
    setGuestNames((current) =>
      Array.from({ length: normalizedCount }, (_, index) => current[index] ?? "")
    );
  }

  return (
    <div className="wac-page pb-24 pt-24 md:pt-32">
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm opacity-60 hover:opacity-100 hover:text-[var(--accent)] transition mb-8"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        Back to Events
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="relative flex h-52 w-full items-center justify-center overflow-hidden rounded-3xl border border-amber-500/20 bg-amber-500/10 sm:h-64 md:h-96">
            {event.cover_image_url ? (
              <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500/40"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            )}
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {event.event_type && (
                <span className="wac-button-chip-primary bg-amber-500/10 text-amber-300 pointer-events-none py-1.5">
                  {event.event_type}
                </span>
              )}
              <span className="text-xs uppercase tracking-[0.18em] text-white/35">
                {event.visibility}
              </span>
            </div>

            <h1 className="mb-5 font-serif text-3xl font-bold tracking-tight sm:text-4xl md:mb-6 md:text-5xl">
              {event.title}
            </h1>

            <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-8 font-medium opacity-80 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-[var(--accent)]" />
                {displayDate}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[var(--accent)]" />
                {displayTime}
              </div>
              {displayLocation && (
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-[var(--accent)]" />
                  <span>{displayLocation}</span>
                </div>
              )}
              {event.virtual_link && (
                <a
                  href={event.virtual_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-[var(--accent)] hover:underline"
                >
                  <Globe size={18} />
                  Join virtually
                </a>
              )}
            </div>

            <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-white/35">Hosted by</div>
              <div className="mt-2 text-lg font-semibold text-white/85">{hostDisplayName}</div>
              {representativeName && (
                <div className="mt-1 text-sm text-white/50">Representative: {representativeName}</div>
              )}
              {hosting.co_hosts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {hosting.co_hosts.map((coHost) => (
                    <span
                      key={coHost.id}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70"
                    >
                      {coHost.name}
                    </span>
                  ))}
                </div>
              )}
              {hosting.linked_entity?.name && hosting.linked_entity.id !== hosting.host_entity?.id && (
                <div className="mt-3 text-sm text-white/45">Linked to {hosting.linked_entity.name}</div>
              )}
            </div>

            <h2 className="mb-4 font-serif text-2xl font-bold">About this Event</h2>
            <p className="whitespace-pre-wrap text-base leading-relaxed opacity-80 sm:text-lg">
              {event.description || "Details will be shared by the host soon."}
            </p>

            {(questions.length > 0 || event.allow_plus_ones || event.require_guest_names || event.waitlist_enabled) && (
              <div className="mt-10 space-y-4">
                <h2 className="text-2xl font-serif font-bold">RSVP Details</h2>
                {questions.length > 0 && (
                  <div className="wac-card space-y-3 p-4 sm:p-5">
                    <div className="text-sm font-semibold text-white/80">Questions you&apos;ll answer when RSVPing</div>
                    {questions.map((question) => (
                      <div key={question.id} className="rounded-xl border border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
                        <div className="text-sm text-white/80">{question.question_text}</div>
                        <div className="mt-1 text-xs text-white/40">
                          {question.question_type === "yesno" ? "Yes / No" : question.question_type === "choice" ? "Multiple choice" : "Short answer"}
                          {question.is_required ? " · Required" : " · Optional"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {event.allow_plus_ones && (
                    <div className="wac-card p-4 text-sm text-white/75">
                      Plus-ones are allowed for this event.
                    </div>
                  )}
                  {event.require_guest_names && (
                    <div className="wac-card p-4 text-sm text-white/75">
                      Guest names are required during RSVP.
                    </div>
                  )}
                  {event.waitlist_enabled && (
                    <div className="wac-card p-4 text-sm text-white/75">
                      A waitlist is enabled if capacity is reached.
                    </div>
                  )}
                </div>
              </div>
            )}

            {isHost && (
              <div className="mt-10 space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-serif font-bold">Host RSVP Manager</h2>
                      <p className="mt-1 text-sm text-white/45">
                        Search attendees, guests, or RSVP answers and filter by status.
                      </p>
                    </div>
                    <div className="text-xs uppercase tracking-[0.14em] text-white/35">
                      Showing {visibleHostRsvpCount} of {hostRsvps.length}
                    </div>
                  </div>

                  <div className="wac-card space-y-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row">
                      <input
                        type="text"
                        value={hostSearchQuery}
                        onChange={(event) => setHostSearchQuery(event.target.value)}
                        placeholder="Search by attendee, guest, or answer"
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hostFilterOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setHostSectionFilter(option.key)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            hostSectionFilter === option.key
                              ? "border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--accent)]"
                              : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white/80"
                          }`}
                        >
                          {option.label} ({option.count})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {hostRsvpSections.length === 0 ? (
                  <div className="wac-card p-5 text-sm text-white/60">
                    {hostRsvps.length === 0 ? "No RSVPs yet." : "No RSVPs match the current search or filter."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hostRsvpSections.map((section) => (
                      <div key={section.key} className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/40">
                            {section.title}
                          </h3>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/50">
                            {section.entries.length}
                          </span>
                        </div>
                        {section.entries.map((entry) => (
                          <div key={entry.id} className="wac-card space-y-4 p-4 sm:p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <div className="min-w-0">
                                <div className="text-base font-semibold text-white/85">
                                  {entry.profile?.full_name || entry.profile?.username || "Member"}
                                </div>
                                <div className="mt-1 text-xs leading-relaxed text-white/40">
                                  Status: {entry.status} · Approval: {entry.approval_status} · Guests: {entry.guest_count}
                                </div>
                              </div>
                              {entry.status === "going" && (
                                <div className="grid grid-cols-2 gap-2 sm:flex">
                                  {getHostPrimaryActionLabel(entry) && (
                                    <button
                                      onClick={() => void handleHostApproval(entry.user_id, "approved")}
                                      disabled={hostActionUserId === entry.user_id}
                                      className="rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-300 disabled:opacity-40"
                                    >
                                      {hostActionUserId === entry.user_id ? "Working..." : getHostPrimaryActionLabel(entry)}
                                    </button>
                                  )}
                                  {event.waitlist_enabled && entry.approval_status === "approved" && (
                                    <button
                                      onClick={() => void handleHostApproval(entry.user_id, "waitlisted")}
                                      disabled={hostActionUserId === entry.user_id}
                                      className="rounded-full bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-300 disabled:opacity-40"
                                    >
                                      {hostActionUserId === entry.user_id ? "Working..." : "Waitlist"}
                                    </button>
                                  )}
                                  {entry.approval_status !== "declined" && (
                                    <button
                                      onClick={() => void handleHostApproval(entry.user_id, "declined")}
                                      disabled={hostActionUserId === entry.user_id}
                                      className="rounded-full bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-300 disabled:opacity-40"
                                    >
                                      {hostActionUserId === entry.user_id ? "Working..." : "Decline"}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {entry.guest_names.length > 0 && (
                              <div>
                                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                                  Guest Names
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {entry.guest_names.filter(Boolean).map((name, index) => (
                                    <span key={`${entry.id}-guest-${index}`} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {Object.keys(entry.rsvp_answers).length > 0 && (
                              <div>
                                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                                  RSVP Answers
                                </div>
                                <div className="space-y-2">
                                  {questions.map((question) => {
                                    const answer = entry.rsvp_answers[question.id];
                                    if (!answer) return null;
                                    return (
                                      <div key={`${entry.id}-${question.id}`} className="rounded-xl border border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
                                        <div className="text-xs text-white/45">{question.question_text}</div>
                                        <div className="mt-1 text-sm text-white/80">{answer}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-4 lg:sticky lg:top-24 lg:col-span-1 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold">Registration</h3>
              {rsvpStateLabel && (
                <div className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
                  {rsvpStateLabel}
                </div>
              )}
            </div>
          </div>

          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 text-sm">
              <span className="opacity-60">Access</span>
              <span className="font-bold capitalize">{event.access_mode.replace("_", " ")}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 text-sm">
              <span className="opacity-60">Attending</span>
              <span className="font-bold">{goingCount}</span>
            </div>
            {remainingSpots !== null && (
              <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4 text-sm">
                <span className="opacity-60">Spots Left</span>
                <span className="font-bold">{remainingSpots}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 pb-2 text-sm">
              <span className="opacity-60">Hosted By</span>
              <span className="font-bold text-[var(--accent)] text-right">
                {event.created_by ? "WAC Member Host" : "WAC"}
              </span>
            </div>
          </div>

          {success && (
            <div className="mb-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-bold text-center">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          {event.rsvp_enabled ? (
            <div className="space-y-3">
              {event.allow_plus_ones && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                    Guest Count
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateGuestCount(guestCount - 1)}
                      disabled={guestCount <= 1}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/65 transition-colors hover:border-white/20 hover:text-white disabled:cursor-default disabled:opacity-35"
                    >
                      <Minus size={14} />
                    </button>
                    <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                      <div className="text-2xl font-semibold text-white">{guestCount}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/35">
                        {guestCount === 1 ? "Attendee" : "Guests total"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateGuestCount(guestCount + 1)}
                      disabled={guestCount >= maxGuestCount}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/65 transition-colors hover:border-white/20 hover:text-white disabled:cursor-default disabled:opacity-35"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-white/35">
                    {event.capacity !== null
                      ? `Up to ${maxGuestCount} people can be attached to this RSVP based on current event capacity.`
                      : "Adjust how many people you're RSVPing for, then fill in names below."}
                  </div>
                </div>
              )}

              {(event.require_guest_names || event.allow_plus_ones) && (
                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-sm font-semibold text-white/80">Guest details</div>
                  {Array.from({ length: guestCount }, (_, index) => (
                    <input
                      key={index}
                      type="text"
                      value={guestNames[index] ?? ""}
                      onChange={(inputEvent) =>
                        setGuestNames((current) =>
                          current.map((name, nameIndex) =>
                            nameIndex === index ? inputEvent.target.value : name
                          )
                        )
                      }
                      placeholder={index === 0 ? "Your name" : `Guest ${index + 1} name`}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[var(--accent)]"
                    />
                  ))}
                </div>
              )}

              {questions.length > 0 && (
                <div className="space-y-3 rounded-2xl border border-white/10 p-4">
                  <div className="text-sm font-semibold text-white/80">RSVP Questions</div>
                  {questions.map((question) => (
                    <div key={question.id} className="space-y-1.5">
                      <label className="mb-1.5 block text-sm text-white/75">
                        {question.question_text}
                        {question.is_required ? " *" : ""}
                      </label>
                      {question.question_type === "yesno" ? (
                        <PremiumSelect
                          value={questionAnswers[question.id] ?? ""}
                          onChange={(nextValue) =>
                            setQuestionAnswers((current) => ({
                              ...current,
                              [question.id]: nextValue,
                            }))
                          }
                          options={[
                            { value: "", label: "Select" },
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                          ]}
                          triggerClassName="w-full border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white"
                        />
                      ) : (
                        <input
                          type="text"
                          value={questionAnswers[question.id] ?? ""}
                          onChange={(eventValue) =>
                            setQuestionAnswers((current) => ({
                              ...current,
                              [question.id]: eventValue.target.value,
                            }))
                          }
                          placeholder={question.question_type === "choice" ? "Enter your answer" : "Type your answer"}
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[var(--accent)]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}


              <button
                onClick={() => void handleRsvp("going")}
                disabled={isSubmitting || isGoingLocked}
                className={`flex w-full items-center justify-center gap-2 rounded-full py-4 font-bold transition ${
                  isGoingLocked
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-[var(--accent)] text-black hover:bg-[#ffe17d]"
                }`}
              >
                {primaryRsvpLabel}
              </button>

              <button
                onClick={() => void handleRsvp("interested")}
                disabled={isSubmitting || rsvp?.status === "interested"}
                className={`w-full rounded-full border py-3 font-bold transition ${
                  rsvp?.status === "interested"
                    ? "border-[var(--accent)] text-[var(--accent)] cursor-default"
                    : "border-white/20 hover:border-white/50 bg-[rgba(255,255,255,0.02)]"
                }`}
              >
                {rsvp?.status === "interested" ? "Marked as Interested" : "Interested"}
              </button>

              <button
                onClick={() => void handleRsvp("not_going")}
                disabled={isSubmitting || rsvp?.status === "not_going"}
                className={`w-full rounded-full border py-3 font-bold transition ${
                  rsvp?.status === "not_going"
                    ? "border-white/12 text-white/40 cursor-default"
                    : "border-white/20 hover:border-white/50 bg-[rgba(255,255,255,0.02)]"
                }`}
              >
                {rsvp?.status === "not_going" ? "Not Going" : "Not Going / Withdraw"}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 p-4 text-sm text-white/65">
              RSVP is not enabled for this event.
            </div>
          )}

          <div className="mt-6 space-y-2 text-xs opacity-60">
            {event.requires_approval && <div>Host approval is required before attendance is confirmed.</div>}
            {event.allow_plus_ones && (
              <div className="flex items-center gap-2">
                <Users size={14} />
                Plus-ones are allowed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


