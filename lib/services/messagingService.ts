import { supabase } from "../supabase";

export type MessagingActorType = "user" | "business" | "organization";

export interface MessagingContact {
  id: string;
  name: string;
  headline: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  type: MessagingActorType;
  username_or_slug: string | null;
}

export async function searchMessagingContacts(query: string): Promise<MessagingContact[]> {
  if (!query || query.length < 2) return [];

  const [profilesRes, businessesRes, orgsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, headline, avatar_url, is_verified, username")
      .ilike("full_name", `%${query}%`)
      .limit(5),
    supabase
      .from("businesses")
      .select("id, name, category, logo_url, is_verified, slug")
      .ilike("name", `%${query}%`)
      .limit(5),
    supabase
      .from("organizations")
      .select("id, name, organization_type, logo_url, is_verified, slug")
      .ilike("name", `%${query}%`)
      .limit(5)
  ]);

  const results: MessagingContact[] = [];

  if (profilesRes.data) {
    results.push(...profilesRes.data.map(p => ({
      id: p.id,
      name: p.full_name || "Unknown User",
      headline: p.headline,
      avatar_url: p.avatar_url,
      is_verified: p.is_verified || false,
      type: 'user' as const,
      username_or_slug: p.username
    })));
  }

  if (businessesRes.data) {
    results.push(...businessesRes.data.map(b => ({
      id: b.id,
      name: b.name,
      headline: b.category,
      avatar_url: b.logo_url,
      is_verified: b.is_verified || false,
      type: 'business' as const,
      username_or_slug: b.slug
    })));
  }

  if (orgsRes.data) {
    results.push(...orgsRes.data.map(o => ({
      id: o.id,
      name: o.name,
      headline: o.organization_type,
      avatar_url: o.logo_url,
      is_verified: o.is_verified || false,
      type: 'organization' as const,
      username_or_slug: o.slug
    })));
  }

  return results.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 10);
}

export async function getOrCreateConversation(
  currentActorId: string,
  currentActorType: MessagingActorType,
  targetId: string,
  targetType: MessagingActorType
): Promise<{ success: boolean; conversationId?: string; error?: unknown }> {
  try {
    // 1. Check if a direct conversation already exists between these two exact actors
    // This requires finding a conversation where BOTH participants exist AND it's a 'direct' type
    const { data: existingConversations, error: searchError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("actor_id", currentActorId)
      .eq("actor_type", currentActorType);

    if (searchError) throw searchError;

    if (existingConversations && existingConversations.length > 0) {
      const conversationIds = existingConversations.map(c => c.conversation_id);
      
      const { data: targetMatches, error: matchError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, conversations!inner(type)")
        .in("conversation_id", conversationIds)
        .eq("actor_id", targetId)
        .eq("actor_type", targetType)
        .eq("conversations.type", "direct");

      if (matchError) throw matchError;

      if (targetMatches && targetMatches.length > 0) {
        return { success: true, conversationId: targetMatches[0].conversation_id };
      }
    }

    // 2. If no existing conversation, create a new one
    const { data: newConversation, error: createConvError } = await supabase
      .from("conversations")
      .insert([{ type: 'direct' }])
      .select("id")
      .single();

    if (createConvError) throw createConvError;

    const conversationId = newConversation.id;

    // 3. Add both participants
    const { error: addParticipantsError } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: conversationId, actor_id: currentActorId, actor_type: currentActorType },
        { conversation_id: conversationId, actor_id: targetId, actor_type: targetType }
      ]);

    if (addParticipantsError) throw addParticipantsError;

    return { success: true, conversationId };

  } catch (error) {
    console.error("Error creating conversation:", error);
    return { success: false, error };
  }
}

export async function createGroupConversation(
  currentActorId: string,
  currentActorType: MessagingActorType,
  participants: { id: string; type: MessagingActorType }[],
  groupName?: string
): Promise<{ success: boolean; conversationId?: string; error?: unknown }> {
  try {
    // 1. Create a new group conversation
    const { data: newConversation, error: createConvError } = await supabase
      .from("conversations")
      .insert([{ type: 'group', title: groupName || null }])
      .select("id")
      .single();

    if (createConvError) throw createConvError;

    const conversationId = newConversation.id;

    // 2. Add all participants, including the current user
    const allParticipants = [
      { conversation_id: conversationId, actor_id: currentActorId, actor_type: currentActorType },
      ...participants.map(p => ({
        conversation_id: conversationId,
        actor_id: p.id,
        actor_type: p.type
      }))
    ];

    const { error: addParticipantsError } = await supabase
      .from("conversation_participants")
      .insert(allParticipants);

    if (addParticipantsError) throw addParticipantsError;

    return { success: true, conversationId };

  } catch (error) {
    console.error("Error creating group conversation:", error);
    return { success: false, error };
  }
}

export interface ConversationOverview {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  updated_at: string;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
  };
  other_participant?: {
    id: string;
    name: string;
    avatar_url: string | null;
    type: MessagingActorType;
    is_online?: boolean;
    profile_url?: string;
  };
  participants?: {
    id: string;
    name: string;
    avatar_url: string | null;
    type: MessagingActorType;
  }[];
  unread_count: number;
}

export async function getUserConversations(
  actorId: string,
  actorType: MessagingActorType
): Promise<ConversationOverview[]> {
  try {
    // 1. Fetch conversations the user is in
    const { data: participants, error } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        last_read_at,
        conversations ( id, type, title, updated_at )
      `)
      .eq("actor_id", actorId)
      .eq("actor_type", actorType);

    if (error) throw error;
    if (!participants || participants.length === 0) return [];

    const conversationIds = participants.map((p) => p.conversation_id);

    // 2. Fetch all participants for these conversations to find the "other" person
    const { data: allParticipants, error: allPartError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, actor_id, actor_type")
      .in("conversation_id", conversationIds)
      .or(`actor_id.neq.${actorId},actor_type.neq.${actorType}`);

    if (allPartError) throw allPartError;

    // 3. Fetch the last message for each conversation + all messages for unread counting
    const { data: lastMessages, error: msgError } = await supabase
      .from("messages")
      .select("id, conversation_id, content, created_at, sender_id, sender_type, is_read, status")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    if (msgError) throw msgError;

    // Filter to just the most recent message per conversation
    const latestMsgsMap = new Map();
    // Build a per-conversation message list for real unread counts
    const allMsgsMap = new Map<string, typeof lastMessages>();
    if (lastMessages) {
      for (const msg of lastMessages) {
        if (!latestMsgsMap.has(msg.conversation_id)) {
          latestMsgsMap.set(msg.conversation_id, msg);
        }
        if (!allMsgsMap.has(msg.conversation_id)) {
          allMsgsMap.set(msg.conversation_id, []);
        }
        allMsgsMap.get(msg.conversation_id)!.push(msg);
      }
    }

    // 4. Fetch profiles for the other participants
    // To do this efficiently, collect IDs by type
    const userIds = new Set<string>();
    const businessIds = new Set<string>();
    const orgIds = new Set<string>();

    if (allParticipants) {
      for (const p of allParticipants) {
        if (p.actor_type === 'user') userIds.add(p.actor_id);
        else if (p.actor_type === 'business') businessIds.add(p.actor_id);
        else if (p.actor_type === 'organization') orgIds.add(p.actor_id);
      }
    }

    const profilesMap = new Map();

    if (userIds.size > 0) {
      const { data: pData } = await supabase.from("profiles").select("id, full_name, avatar_url, username").in("id", Array.from(userIds));
      pData?.forEach(p => profilesMap.set(p.id, { name: p.full_name, avatar_url: p.avatar_url, type: 'user', username: p.username }));
    }
    if (businessIds.size > 0) {
      const { data: bData } = await supabase.from("businesses").select("id, name, logo_url, slug").in("id", Array.from(businessIds));
      bData?.forEach(b => profilesMap.set(b.id, { name: b.name, avatar_url: b.logo_url, type: 'business', slug: b.slug }));
    }
    if (orgIds.size > 0) {
      const { data: oData } = await supabase.from("organizations").select("id, name, logo_url, slug").in("id", Array.from(orgIds));
      oData?.forEach(o => profilesMap.set(o.id, { name: o.name, avatar_url: o.logo_url, type: 'organization', slug: o.slug }));
    }

    // 5. Assemble the final overview
    const overviews: ConversationOverview[] = participants.map((p) => {
      const conv = Array.isArray(p.conversations) ? p.conversations[0] : p.conversations;
      const otherPart = allParticipants?.find(op => op.conversation_id === p.conversation_id);
      const otherPartProfile = otherPart ? profilesMap.get(otherPart.actor_id) : null;
      const lastMsg = latestMsgsMap.get(p.conversation_id);

      // Real unread count: count messages from others that arrived after our last_read_at
      const readDate = new Date(p.last_read_at);
      const convMsgs = allMsgsMap.get(p.conversation_id) ?? [];
      const unread_count = convMsgs.filter((m) =>
        !(m.sender_id === actorId && m.sender_type === actorType) &&
        new Date(m.created_at) > readDate
      ).length;

      const groupParts = allParticipants?.filter(op => op.conversation_id === p.conversation_id && conv?.type === 'group');
      const groupProfiles = groupParts ? groupParts.map(gp => {
        const prof = profilesMap.get(gp.actor_id);
        return prof ? { id: gp.actor_id, ...prof } : null;
      }).filter(Boolean) : [];

      return {
        id: p.conversation_id,
        type: conv?.type as "direct" | "group",
        title: conv?.title || undefined,
        updated_at: conv?.updated_at || "",
        last_message: lastMsg ? {
          content: lastMsg.content,
          created_at: lastMsg.created_at,
          sender_id: lastMsg.sender_id,
          is_read: lastMsg.is_read
        } : undefined,
        other_participant: conv?.type === 'direct' && otherPart && otherPartProfile ? {
          id: otherPart.actor_id,
          name: otherPartProfile.name || "Unknown",
          avatar_url: otherPartProfile.avatar_url,
          type: otherPartProfile.type,
          profile_url: otherPartProfile.type === 'user' && otherPartProfile.username
            ? `/people/${otherPartProfile.username}`
            : otherPartProfile.type === 'business' && otherPartProfile.slug
              ? `/businesses/${otherPartProfile.slug}`
              : otherPartProfile.type === 'organization' && otherPartProfile.slug
                ? `/organizations/${otherPartProfile.slug}`
                : undefined,
        } : undefined,
        participants: conv?.type === 'group' ? groupProfiles : undefined,
        unread_count
      };
    });

    // Sort by most recently updated
    return overviews.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  } catch (err) {
    console.error("Error fetching user conversations:", err);
    return [];
  }
}

export type MessageMetadata = {
  type: "entity_card";
  entity_type: "person" | "business" | "organization";
  entity_id: string;
  name: string;
  avatar_url?: string;
  headline?: string;
  url: string;
} | null;

export interface MessageInterface {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: MessagingActorType;
  content: string;
  reactions: string[];
  reply_to_id: string | null;
  metadata: MessageMetadata;
  status: "sending" | "sent" | "delivered" | "seen";
  created_at: string;
}

export async function getMessages(conversationId: string): Promise<MessageInterface[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data as MessageInterface[];
}

export async function markConversationRead(
  conversationId: string,
  actorId: string,
  actorType: MessagingActorType
): Promise<void> {
  const { error } = await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("actor_id", actorId)
    .eq("actor_type", actorType);

  if (error) {
    console.error("Error marking conversation read:", error);
  }

  // Mark unread messages from OTHER senders as "seen"
  await supabase
    .from("messages")
    .update({ status: "seen" })
    .eq("conversation_id", conversationId)
    .neq("sender_id", actorId)
    .in("status", ["sent", "delivered"]);
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderType: MessagingActorType,
  content: string,
  replyToId?: string,
  metadata?: MessageMetadata,
): Promise<MessageInterface | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      sender_id: senderId,
      sender_type: senderType,
      content,
      reactions: [],
      ...(replyToId ? { reply_to_id: replyToId } : {}),
      ...(metadata ? { metadata } : {}),
    }])
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    return null;
  }

  const { error: touchError } = await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (touchError) {
    console.error("Error updating conversation timestamp:", touchError);
  }

  return data as MessageInterface;
}

// ── Inbox search: search across message content in user's conversations ──────

export interface MessageSearchResult {
  message_id: string;
  conversation_id: string;
  content: string;
  sender_name: string;
  conversation_title: string;
  created_at: string;
}

export async function searchConversationMessages(
  actorId: string,
  actorType: MessagingActorType,
  query: string,
): Promise<MessageSearchResult[]> {
  if (!query || query.length < 2) return [];

  try {
    // Get user's conversation IDs
    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("actor_id", actorId)
      .eq("actor_type", actorType);

    if (!parts || parts.length === 0) return [];
    const convIds = parts.map((p) => p.conversation_id);

    // Search messages across those conversations
    const { data: msgs, error } = await supabase
      .from("messages")
      .select("id, conversation_id, content, sender_id, sender_type, created_at")
      .in("conversation_id", convIds)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !msgs) return [];

    // Collect sender IDs for name lookup
    const senderIds = [...new Set(msgs.map((m) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", senderIds);

    const nameMap = new Map<string, string>();
    profiles?.forEach((p) => nameMap.set(p.id, p.full_name));

    return msgs.map((m) => ({
      message_id: m.id,
      conversation_id: m.conversation_id,
      content: m.content,
      sender_name: nameMap.get(m.sender_id) ?? "Member",
      conversation_title: "", // Filled client-side from existing data
      created_at: m.created_at,
    }));
  } catch (err) {
    console.error("Error searching messages:", err);
    return [];
  }
}

export async function toggleMessageReactionDB(msgId: string, reactionType: string, currentReactions: string[]): Promise<void> {
  const hasReacted = currentReactions.includes(reactionType);
  const newReactions = hasReacted 
    ? currentReactions.filter(r => r !== reactionType)
    : [...currentReactions, reactionType];

  const { error } = await supabase
    .from('messages')
    .update({ reactions: newReactions })
    .eq('id', msgId);

  if (error) {
    console.error("Error updating reactions:", error);
  }
}
