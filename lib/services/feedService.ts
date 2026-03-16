import { supabase } from "@/lib/supabase";
import { NetworkPost } from "@/lib/types/network-feed";

// Types of reactions we support
export type ReactionType = 'like' | 'heart' | 'laugh' | 'applause';

export async function togglePostReaction(
  postId: string, 
  reactionType: ReactionType = 'like'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { success: false, error: "Authentication required to react to a post." };
    }
    
    const userId = session.user.id;
    
    // Check if the user already has a reaction
    const { data: existingReaction, error: checkError } = await supabase
      .from("feed_likes")
      .select("*")
      .eq("post_id", postId)
      .eq("profile_id", userId)
      .single();
      
    if (checkError && checkError.code !== "PGRST116") { 
       console.error("Error checking existing reaction:", checkError);
       return { success: false, error: "Failed to check existing reaction status." };
    }

    if (existingReaction) {
      if (existingReaction.reaction_type === reactionType) {
        // Toggling the SAME reaction off (un-react)
        const { error: deleteError } = await supabase
          .from("feed_likes")
          .delete()
          .eq("id", existingReaction.id);
          
        if (deleteError) {
          console.error("Error un-reacting:", deleteError);
          return { success: false, error: "Failed to remove reaction." };
        }
      } else {
        // Switching to a DIFFERENT reaction type
        const { error: updateError } = await supabase
          .from("feed_likes")
          .update({ reaction_type: reactionType })
          .eq("id", existingReaction.id);

        if (updateError) {
          console.error("Error updating reaction:", updateError);
          return { success: false, error: "Failed to update reaction." };
        }
      }
    } else {
      // User hasn't reacted yet, INSERT new reaction
      const { error: insertError } = await supabase
        .from("feed_likes")
        .insert({
          post_id: postId,
          profile_id: userId,
          reaction_type: reactionType
        });
        
      if (insertError) {
        console.error("Error adding reaction:", insertError);
        return { success: false, error: "Failed to add reaction to the post." };
      }
    }

    return { success: true };
    
  } catch (err: any) {
    console.error("Exception in togglePostReaction:", err);
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function getAuthorProfileId(userId: string): Promise<string | null> {
  if (typeof window === "undefined") return userId; // Default to user ID on server

  const actorJson = localStorage.getItem("wac_active_actor");
  if (actorJson) {
    try {
      const actor = JSON.parse(actorJson);
      // If the active actor is a business or organization, we might want to return null
      // or a specific profile ID associated with that entity.
      // For now, if it's a business/org, we assume the comment is still made by the user's profile.
      // This logic might need refinement based on how you want to attribute comments from entities.
      if (actor.type === "business" || actor.type === "organization") {
        // If comments from businesses/orgs should be attributed to a specific profile,
        // you'd fetch that profile ID here. For now, we'll default to the user's profile.
        return userId;
      }
    } catch (e) {
      console.error("Failed to parse actor JSON in getAuthorProfileId", e);
    }
  }
  return userId; // Default to the user's profile ID
}

export async function addPostComment(
  postId: string,
  content: string,
  parentId?: string | null
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (sessionError || !userId) {
      return { success: false, error: "Authentication required to comment." };
    }

    const authorProfileId = await getAuthorProfileId(userId);

    const payload: any = {
      post_id: postId,
      content,
      submitted_by: userId,
    };

    if (parentId) {
      payload.parent_id = parentId;
    }

    if (authorProfileId) payload.author_profile_id = authorProfileId;

    const { data, error } = await supabase
      .from("feed_comments")
      .insert([payload])
      .select(`
        *,
        author_profile:profiles!author_profile_id(full_name, username, avatar_url, is_verified),
        author_business:businesses(name, slug, logo_url, is_verified),
        author_organization:organizations(name, slug, logo_url, is_verified)
      `)
      .single();

    if (error) {
      console.error("Error inserting comment:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("addPostComment catch error:", err);
    return { success: false, error: err };
  }
}

export type MentionSuggestion = {
  id: string;
  type: 'profile' | 'business' | 'organization';
  name: string;
  avatar_url: string | null;
  username_or_slug: string | null;
  is_verified?: boolean;
};

export async function searchMentionSuggestions(query: string): Promise<MentionSuggestion[]> {
  if (!query || query.length < 2) return [];
  
  try {
    const searchTerm = `%${query}%`;
    
    // Perform 3 parallel queries
    const [profilesRes, bizRes, orgRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, username, avatar_url, is_verified').ilike('full_name', searchTerm).order('full_name').limit(5),
      supabase.from('businesses').select('id, name, slug, logo_url, is_verified').ilike('name', searchTerm).order('name').limit(5),
      supabase.from('organizations').select('id, name, slug, logo_url, is_verified').ilike('name', searchTerm).order('name').limit(5),
    ]);
    
    const results: MentionSuggestion[] = [];
    
    if (profilesRes.data) {
      results.push(...profilesRes.data.map(p => ({
        id: p.id,
        type: 'profile' as const,
        name: p.full_name || 'User',
        avatar_url: p.avatar_url,
        username_or_slug: p.username,
        is_verified: p.is_verified
      })));
    }
    if (bizRes.data) {
      results.push(...bizRes.data.map(b => ({
        id: b.id,
        type: 'business' as const,
        name: b.name,
        avatar_url: b.logo_url,
        username_or_slug: b.slug,
        is_verified: b.is_verified
      })));
    }
    if (orgRes.data) {
      results.push(...orgRes.data.map(o => ({
        id: o.id,
        type: 'organization' as const,
        name: o.name,
        avatar_url: o.logo_url,
        username_or_slug: o.slug,
        is_verified: o.is_verified
      })));
    }
    
    return results;
  } catch (err) {
    console.error("Error fetching mention suggestions:", err);
    return [];
  }
}

export async function deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return { success: false, error: "Authentication required." };
    
    // Deleting the post will also delete likes and comments due to ON DELETE CASCADE
    const { error } = await supabase
      .from("feed_posts")
      .delete()
      .eq("id", postId)
      .eq("author_profile_id", session.user.id);
      
    if (error) return { success: false, error: "Failed to delete post." };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function editPost(postId: string, newContent: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return { success: false, error: "Authentication required." };

    const { error } = await supabase
      .from("feed_posts")
      .update({ content: newContent })
      .eq("id", postId)
      .eq("author_profile_id", session.user.id);

    if (error) return { success: false, error: "Failed to edit post." };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return { success: false, error: "Authentication required." };
    
    const { error } = await supabase
      .from("feed_comments")
      .delete()
      .eq("id", commentId)
      .eq("submitted_by", session.user.id);
      
    if (error) return { success: false, error: "Failed to delete comment." };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function editComment(commentId: string, newContent: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return { success: false, error: "Authentication required." };

    const { error } = await supabase
      .from("feed_comments")
      .update({ content: newContent })
      .eq("id", commentId)
      .eq("submitted_by", session.user.id);

    if (error) return { success: false, error: "Failed to edit comment." };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}
