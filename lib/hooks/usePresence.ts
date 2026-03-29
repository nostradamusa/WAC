"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────

type PresenceState = {
  /** Whether the other user is actively online in this conversation */
  isOnline: boolean;
  /** Whether the other user is currently typing */
  isTyping: boolean;
  /** Last active timestamp (ISO string) — from DB, for "Active 5m ago" */
  lastActiveAt: string | null;
};

type PresencePayload = {
  type: "typing" | "presence";
  actor_id: string;
  /** true = started typing / went online; false = stopped */
  active: boolean;
};

// ── Presence display helpers ─────────────────────────────────────────────────

export function formatPresence(state: PresenceState): string | null {
  if (state.isTyping) return "Typing...";
  if (state.isOnline) return "Active now";
  if (!state.lastActiveAt) return null;

  const diff = Date.now() - new Date(state.lastActiveAt).getTime();
  const mins = Math.floor(diff / 60_000);

  if (mins < 1) return "Active just now";
  if (mins < 60) return `Active ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  return null; // Too stale to show
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePresence(
  conversationId: string | null,
  myActorId: string | null,
  otherActorId?: string | null,
) {
  const [presence, setPresence] = useState<PresenceState>({
    isOnline: false,
    isTyping: false,
    lastActiveAt: null,
  });

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Subscribe to conversation presence channel ──
  useEffect(() => {
    if (!conversationId || !myActorId) return;

    const channelName = `presence:${conversationId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "presence" }, ({ payload }) => {
        const data = payload as PresencePayload;
        if (data.actor_id === myActorId) return; // Ignore own events

        if (data.type === "typing") {
          setPresence((prev) => ({ ...prev, isTyping: data.active }));
          // Auto-clear typing after 4s if no "stopped" event arrives
          if (data.active) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setPresence((prev) => ({ ...prev, isTyping: false }));
            }, 4000);
          }
        } else if (data.type === "presence") {
          setPresence((prev) => ({ ...prev, isOnline: data.active }));
        }
      })
      .subscribe();

    // Announce own presence
    channel.send({
      type: "broadcast",
      event: "presence",
      payload: { type: "presence", actor_id: myActorId, active: true } satisfies PresencePayload,
    });

    // Heartbeat every 30s
    heartbeatRef.current = setInterval(() => {
      channel.send({
        type: "broadcast",
        event: "presence",
        payload: { type: "presence", actor_id: myActorId, active: true } satisfies PresencePayload,
      });
    }, 30_000);

    return () => {
      // Announce departure
      channel.send({
        type: "broadcast",
        event: "presence",
        payload: { type: "presence", actor_id: myActorId, active: false } satisfies PresencePayload,
      });
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, myActorId]);

  // ── Fetch last_active_at for the other participant ──
  useEffect(() => {
    if (!otherActorId) return;
    supabase
      .from("profiles")
      .select("last_active_at")
      .eq("id", otherActorId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.last_active_at) {
          setPresence((prev) => ({ ...prev, lastActiveAt: data.last_active_at }));
        }
      });
  }, [otherActorId]);

  // ── Broadcast typing state ──
  const sendTyping = useCallback(
    (active: boolean) => {
      if (!channelRef.current || !myActorId) return;
      channelRef.current.send({
        type: "broadcast",
        event: "presence",
        payload: { type: "typing", actor_id: myActorId, active } satisfies PresencePayload,
      });
    },
    [myActorId],
  );

  // ── Update own last_active_at (debounced, max once per 60s) ──
  const lastPingRef = useRef(0);
  const touchLastActive = useCallback(() => {
    if (!myActorId) return;
    const now = Date.now();
    if (now - lastPingRef.current < 60_000) return;
    lastPingRef.current = now;
    supabase
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", myActorId)
      .then(() => {});
  }, [myActorId]);

  return { presence, sendTyping, touchLastActive };
}
