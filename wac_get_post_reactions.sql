CREATE OR REPLACE FUNCTION get_post_reactions_details(p_post_id uuid)
RETURNS TABLE (
  reaction_type text,
  profile_id uuid,
  full_name text,
  avatar_url text,
  headline text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.reaction_type,
    p.id as profile_id,
    p.full_name,
    p.avatar_url,
    p.headline
  FROM feed_likes l
  JOIN profiles p ON l.profile_id = p.id
  WHERE l.post_id = p_post_id
  ORDER BY l.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
