import { supabase } from "@/lib/supabase";
import { PostMediaItem } from "@/lib/types/network-feed";

// Types of reactions we support
export type ReactionType = "like" | "heart" | "laugh" | "fire" | "applause" | "smile";

type ActiveActor = {
  id: string;
  type: "person" | "business" | "organization";
  name?: string;
  avatar_url?: string | null;
};

type AuthorPayload = {
  submitted_by: string;
  author_profile_id?: string;
  author_business_id?: string;
  author_organization_id?: string;
};

export type MentionSuggestion = {
  id: string;
  type: "profile" | "business" | "organization";
  name: string;
  avatar_url: string | null;
  username_or_slug: string | null;
  is_verified?: boolean;
};

// ─── Actor helpers ────────────────────────────────────────────────────────────

function getStoredActiveActor(): ActiveActor | null {
  if (typeof window === "undefined") return null;

  const actorJson = localStorage.getItem("wac_active_actor");
  if (!actorJson) return null;

  try {
    const actor = JSON.parse(actorJson) as ActiveActor;
    if (!actor?.id || !actor?.type) return null;
    return actor;
  } catch (error) {
    console.error("Failed to parse active actor from localStorage:", error);
    return null;
  }
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user?.id) return null;
  return session.user.id;
}

async function getCurrentAuthorPayload(): Promise<{ payload: AuthorPayload | null; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { payload: null, error: "Authentication required." };
  }

  const actor = getStoredActiveActor();

  if (!actor || actor.type === "person") {
    return {
      payload: {
        submitted_by: userId,
        author_profile_id: actor?.id || userId,
      },
    };
  }

  if (actor.type === "business") {
    return {
      payload: {
        submitted_by: userId,
        author_business_id: actor.id,
      },
    };
  }

  if (actor.type === "organization") {
    return {
      payload: {
        submitted_by: userId,
        author_organization_id: actor.id,
      },
    };
  }

  return {
    payload: {
      submitted_by: userId,
      author_profile_id: userId,
    },
  };
}

async function getDeleteEditOwnershipFilter() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const actor = getStoredActiveActor();

  if (!actor || actor.type === "person") {
    return { column: "author_profile_id", value: actor?.id || userId };
  }

  if (actor.type === "business") {
    return { column: "author_business_id", value: actor.id };
  }

  if (actor.type === "organization") {
    return { column: "author_organization_id", value: actor.id };
  }

  return { column: "author_profile_id", value: userId };
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export async function togglePostReaction(
  postId: string,
  reactionType: ReactionType = "like"
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { success: false, error: "Authentication required to react to a post." };
    }

    const userId = session.user.id;

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
        const { error: deleteError } = await supabase
          .from("feed_likes")
          .delete()
          .eq("id", existingReaction.id);

        if (deleteError) {
          console.error("Error removing reaction:", deleteError);
          return { success: false, error: "Failed to remove reaction." };
        }
      } else {
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
      const { error: insertError } = await supabase.from("feed_likes").insert({
        post_id: postId,
        profile_id: userId,
        reaction_type: reactionType,
      });

      if (insertError) {
        console.error("Error adding reaction:", insertError);
        return { success: false, error: "Failed to add reaction to the post." };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Exception in togglePostReaction:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function toggleCommentReaction(
  commentId: string,
  reactionType: ReactionType = "like"
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { success: false, error: "Authentication required." };
    }

    const userId = session.user.id;

    const { data: existingReaction, error: checkError } = await supabase
      .from("comment_reactions")
      .select("*")
      .eq("comment_id", commentId)
      .eq("profile_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      return { success: false, error: "Failed to check existing reaction." };
    }

    if (existingReaction) {
      if (existingReaction.reaction_type === reactionType) {
        const { error } = await supabase
          .from("comment_reactions")
          .delete()
          .eq("id", existingReaction.id);

        if (error) return { success: false, error: error.message };
      } else {
        const { error } = await supabase
          .from("comment_reactions")
          .update({ reaction_type: reactionType })
          .eq("id", existingReaction.id);

        if (error) return { success: false, error: error.message };
      }
    } else {
      const { error } = await supabase.from("comment_reactions").insert({
        comment_id: commentId,
        profile_id: userId,
        reaction_type: reactionType,
      });

      if (error) return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export async function addPostComment(
  postId: string,
  content: string,
  parentId?: string | null
): Promise<{ success: boolean; data?: any; error?: any }> {
  try {
    const { payload, error: authError } = await getCurrentAuthorPayload();
    if (!payload) {
      return { success: false, error: authError || "Authentication required to comment." };
    }

    const insertPayload: Record<string, any> = {
      post_id: postId,
      content,
      submitted_by: payload.submitted_by,
    };

    if (parentId) insertPayload.parent_id = parentId;
    if (payload.author_profile_id) insertPayload.author_profile_id = payload.author_profile_id;
    if (payload.author_business_id) insertPayload.author_business_id = payload.author_business_id;
    if (payload.author_organization_id) insertPayload.author_organization_id = payload.author_organization_id;

    const { data, error } = await supabase
      .from("feed_comments")
      .insert([insertPayload])
      .select(`
        *,
        author_profile:profiles!author_profile_id(full_name, username, avatar_url, headline, is_verified),
        author_business:businesses!author_business_id(name, slug, logo_url, business_type, is_verified),
        author_organization:organizations!author_organization_id(name, slug, logo_url, organization_type, is_verified)
      `)
      .single();

    if (error) {
      console.error("Error inserting comment:", error.message, error.code, error.details, error.hint);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("addPostComment catch error:", error?.message ?? error);
    return { success: false, error: error?.message ?? error };
  }
}

// ─── Mentions ─────────────────────────────────────────────────────────────────

export async function searchMentionSuggestions(query: string): Promise<MentionSuggestion[]> {
  if (!query || query.length < 2) return [];

  try {
    const searchTerm = `%${query}%`;

    const [profilesRes, bizRes, orgRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, is_verified")
        .ilike("full_name", searchTerm)
        .order("full_name")
        .limit(5),

      supabase
        .from("businesses")
        .select("id, name, slug, logo_url, is_verified")
        .ilike("name", searchTerm)
        .order("name")
        .limit(5),

      supabase
        .from("organizations")
        .select("id, name, slug, logo_url, is_verified")
        .ilike("name", searchTerm)
        .order("name")
        .limit(5),
    ]);

    const results: MentionSuggestion[] = [];

    if (profilesRes.data) {
      results.push(
        ...profilesRes.data.map((profile) => ({
          id: profile.id,
          type: "profile" as const,
          name: profile.full_name || "User",
          avatar_url: profile.avatar_url,
          username_or_slug: profile.username,
          is_verified: profile.is_verified,
        }))
      );
    }

    if (bizRes.data) {
      results.push(
        ...bizRes.data.map((business) => ({
          id: business.id,
          type: "business" as const,
          name: business.name,
          avatar_url: business.logo_url,
          username_or_slug: business.slug,
          is_verified: business.is_verified,
        }))
      );
    }

    if (orgRes.data) {
      results.push(
        ...orgRes.data.map((organization) => ({
          id: organization.id,
          type: "organization" as const,
          name: organization.name,
          avatar_url: organization.logo_url,
          username_or_slug: organization.slug,
          is_verified: organization.is_verified,
        }))
      );
    }

    return results;
  } catch (error) {
    console.error("Error fetching mention suggestions:", error);
    return [];
  }
}

// ─── Post CRUD ────────────────────────────────────────────────────────────────

export async function deletePost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ownership = await getDeleteEditOwnershipFilter();
    if (!ownership) return { success: false, error: "Authentication required." };

    const { error } = await supabase
      .from("feed_posts")
      .delete()
      .eq("id", postId)
      .eq(ownership.column, ownership.value);

    if (error) return { success: false, error: "Failed to delete post." };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function editPost(
  postId: string,
  newContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ownership = await getDeleteEditOwnershipFilter();
    if (!ownership) return { success: false, error: "Authentication required." };

    const { error } = await supabase
      .from("feed_posts")
      .update({ content: newContent })
      .eq("id", postId)
      .eq(ownership.column, ownership.value);

    if (error) return { success: false, error: "Failed to edit post." };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

// ─── Comment CRUD ─────────────────────────────────────────────────────────────

export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Authentication required." };

    const { error } = await supabase
      .from("feed_comments")
      .delete()
      .eq("id", commentId)
      .eq("submitted_by", userId);

    if (error) return { success: false, error: "Failed to delete comment." };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function editComment(
  commentId: string,
  newContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Authentication required." };

    const { error } = await supabase
      .from("feed_comments")
      .update({ content: newContent })
      .eq("id", commentId)
      .eq("submitted_by", userId);

    if (error) return { success: false, error: "Failed to edit comment." };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

// ─── Media upload ─────────────────────────────────────────────────────────────

/**
 * Required DB migration — run once in Supabase SQL editor:
 *
 * ALTER TABLE feed_posts
 *   ADD COLUMN IF NOT EXISTS media_items JSONB DEFAULT '[]'::jsonb;
 */

/**
 * Uploads files to the feed_media bucket in parallel and returns an ordered
 * PostMediaItem array.
 */
export async function uploadPostMedia(files: File[], userId: string): Promise<PostMediaItem[]> {
  const results = await Promise.all(
    files.map(async (file, index) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const name = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${index}.${ext}`;
      const path = `${userId}/${name}`;

      const { error: uploadError } = await supabase.storage.from("feed_media").upload(path, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("feed_media").getPublicUrl(path);

      return {
        url: publicUrl,
        media_type: file.type.startsWith("video/") ? ("video" as const) : ("photo" as const),
        order_index: index,
      };
    })
  );

  return results;
}