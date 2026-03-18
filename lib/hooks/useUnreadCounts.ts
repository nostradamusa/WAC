"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// ─── Unread message count ──────────────────────────────────────────────────────
// Counts messages in the current actor's conversations that are unread and not
// sent by the current signed-in user.

export function useUnreadMessageCount(actorId: string | null | undefined, userId: string | null | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!actorId || !userId) { setCount(0); return; }

    async function fetch() {
      // Get conversation IDs where this actor is a participant
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("participant_id", actorId);

      if (!participations || participations.length === 0) { setCount(0); return; }

      const convIds = participations.map((p: any) => p.conversation_id);

      const { count: unread } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .eq("is_read", false)
        .neq("sent_by_user_id", userId);

      setCount(unread ?? 0);
    }

    fetch();

    // Refresh when messages change
    const channel = supabase
      .channel(`unread_count_${actorId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [actorId, userId]);

  return count;
}

// ─── Notification count ────────────────────────────────────────────────────────
// Counts pending connection requests sent to the user + pending entity invites.

export function useNotificationCount(userId: string | null | undefined, userEmail: string | null | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) { setCount(0); return; }

    async function fetch() {
      const [connectionRes, inviteRes] = await Promise.all([
        supabase
          .from("connection_requests")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", userId)
          .eq("status", "pending"),
        userEmail
          ? supabase
              .from("entity_invites")
              .select("id", { count: "exact", head: true })
              .eq("email", userEmail)
              .eq("status", "pending")
          : Promise.resolve({ count: 0, error: null }),
      ]);

      setCount((connectionRes.count ?? 0) + (inviteRes.count ?? 0));
    }

    fetch();

    const channel = supabase
      .channel(`notification_count_${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "connection_requests" }, fetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "entity_invites" }, fetch)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, userEmail]);

  return count;
}
