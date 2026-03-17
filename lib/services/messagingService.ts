import { supabase } from "../supabase";

export interface MessagingContact {
  id: string;
  name: string;
  headline: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  type: 'user' | 'business' | 'organization';
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
  currentUserId: string,
  targetId: string,
  targetType: 'user' | 'business' | 'organization'
): Promise<{ success: boolean; conversationId?: string; error?: any }> {
  try {
    // 1. Check if a direct conversation already exists between these two exact actors
    // This requires finding a conversation where BOTH participants exist AND it's a 'direct' type
    const { data: existingConversations, error: searchError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("actor_id", currentUserId)
      .eq("actor_type", 'user'); // Assuming the current user initiates as a 'user'

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
        { conversation_id: conversationId, actor_id: currentUserId, actor_type: 'user' },
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
  currentUserId: string,
  participants: { id: string; type: 'user' | 'business' | 'organization' }[],
  groupName?: string
): Promise<{ success: boolean; conversationId?: string; error?: any }> {
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
      { conversation_id: conversationId, actor_id: currentUserId, actor_type: 'user' },
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
    type: 'user' | 'business' | 'organization';
    is_online?: boolean;
  };
  participants?: {
    id: string;
    name: string;
    avatar_url: string | null;
    type: 'user' | 'business' | 'organization';
  }[];
  unread_count: number;
}

export async function getUserConversations(
  userId: string
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
      .eq("actor_id", userId);

    if (error) throw error;
    if (!participants || participants.length === 0) return [];

    const conversationIds = participants.map((p) => p.conversation_id);

    // 2. Fetch all participants for these conversations to find the "other" person
    const { data: allParticipants, error: allPartError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, actor_id, actor_type")
      .in("conversation_id", conversationIds)
      .neq("actor_id", userId);

    if (allPartError) throw allPartError;

    // 3. Fetch the last message for each conversation
    const { data: lastMessages, error: msgError } = await supabase
      .from("messages")
      .select("id, conversation_id, content, created_at, sender_id, is_read")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    if (msgError) throw msgError;

    // Filter to just the most recent message per conversation
    const latestMsgsMap = new Map();
    if (lastMessages) {
      for (const msg of lastMessages) {
        if (!latestMsgsMap.has(msg.conversation_id)) {
          latestMsgsMap.set(msg.conversation_id, msg);
        }
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
      const { data: pData } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", Array.from(userIds));
      pData?.forEach(p => profilesMap.set(p.id, { name: p.full_name, avatar_url: p.avatar_url, type: 'user' }));
    }
    if (businessIds.size > 0) {
      const { data: bData } = await supabase.from("businesses").select("id, name, logo_url").in("id", Array.from(businessIds));
      bData?.forEach(b => profilesMap.set(b.id, { name: b.name, avatar_url: b.logo_url, type: 'business' }));
    }
    if (orgIds.size > 0) {
      const { data: oData } = await supabase.from("organizations").select("id, name, logo_url").in("id", Array.from(orgIds));
      oData?.forEach(o => profilesMap.set(o.id, { name: o.name, avatar_url: o.logo_url, type: 'organization' }));
    }

    // 5. Assemble the final overview
    const overviews: ConversationOverview[] = participants.map((p) => {
      const conv = Array.isArray(p.conversations) ? p.conversations[0] : p.conversations;
      const otherPart = allParticipants?.find(op => op.conversation_id === p.conversation_id);
      const otherPartProfile = otherPart ? profilesMap.get(otherPart.actor_id) : null;
      const lastMsg = latestMsgsMap.get(p.conversation_id);

      // Simple unread calculation (if the last message was after our last_read_at, it's unread)
      let unread_count = 0;
      if (lastMsg && lastMsg.sender_id !== userId) {
        const msgDate = new Date(lastMsg.created_at);
        const readDate = new Date(p.last_read_at);
        if (msgDate > readDate) {
          unread_count = 1; // Real counting would require querying all unread msgs, this is a proxy
        }
      }

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
          type: otherPartProfile.type
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

export interface MessageInterface {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'user' | 'business' | 'organization';
  content: string;
  reactions: string[];
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

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderType: 'user' | 'business' | 'organization',
  content: string
): Promise<MessageInterface | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      sender_id: senderId,
      sender_type: senderType,
      content,
      reactions: []
    }])
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    return null;
  }
  return data as MessageInterface;
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
