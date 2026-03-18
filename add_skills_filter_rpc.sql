-- ==========================================
-- WAC People Directory RPC — Skills Filter + Bug Fixes
-- Changes from previous version:
--   1. Added p_skills TEXT[] parameter for skills filtering
--   2. Fixed user_id bug: profiles.id IS the auth uid, not a separate user_id column
--   3. Removed lat/lng/geom columns (not in v_people_directory_enriched)
-- ==========================================

-- Drop all known historical overloads (9, 10, and 11 parameter versions)
DROP FUNCTION IF EXISTS public.get_people_directory_scored(UUID, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_people_directory_scored(UUID, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.get_people_directory_scored(UUID, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION get_people_directory_scored(
  p_user_id UUID,
  p_country TEXT DEFAULT NULL,
  p_industry TEXT DEFAULT NULL,
  p_specialty TEXT DEFAULT NULL,
  p_mentor_only BOOLEAN DEFAULT FALSE,
  p_open_to_work BOOLEAN DEFAULT FALSE,
  p_open_to_hire BOOLEAN DEFAULT FALSE,
  p_open_to_invest BOOLEAN DEFAULT FALSE,
  p_open_to_collaborate BOOLEAN DEFAULT FALSE,
  p_search_query TEXT DEFAULT NULL,
  p_skills TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  headline TEXT,
  profession TEXT,
  profession_name TEXT,
  profession_slug TEXT,
  specialty_name TEXT,
  specialty_slug TEXT,
  industry_name TEXT,
  industry_slug TEXT,
  current_company_coalesced TEXT,
  current_title_coalesced TEXT,
  bio TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  ancestry_country TEXT,
  ancestry_city TEXT,
  ancestry_village TEXT,
  avatar_url TEXT,
  website TEXT,
  linkedin TEXT,
  is_verified BOOLEAN,
  open_to_work BOOLEAN,
  open_to_hire BOOLEAN,
  open_to_mentor BOOLEAN,
  open_to_invest BOOLEAN,
  open_to_collaborate BOOLEAN,
  skills TEXT[],
  relevance_score INT
) AS $$
DECLARE
  v_user_industry TEXT;
  v_user_city TEXT;
  v_user_state TEXT;
  v_user_country TEXT;
  v_user_skills TEXT[];
BEGIN
  -- Load current user's profile for relevance scoring
  -- profiles.id = auth.uid() in Supabase (fixed from incorrect pd.user_id)
  IF p_user_id IS NOT NULL THEN
    SELECT
      pd.industry_name, pd.city, pd.state, pd.country, pd.skills
    INTO
      v_user_industry, v_user_city, v_user_state, v_user_country, v_user_skills
    FROM public.people_directory_v1 pd
    WHERE pd.id = p_user_id;
  END IF;

  RETURN QUERY
  SELECT
    v.id,
    v.username,
    v.full_name,
    v.headline,
    v.profession,
    v.profession_name,
    v.profession_slug,
    v.specialty_name,
    v.specialty_slug,
    v.industry_name,
    v.industry_slug,
    v.current_company_coalesced,
    v.current_title_coalesced,
    v.bio,
    v.country,
    v.state,
    v.city,
    v.ancestry_country,
    v.ancestry_city,
    v.ancestry_village,
    v.avatar_url,
    v.website,
    v.linkedin,
    v.is_verified,
    v.open_to_work,
    v.open_to_hire,
    v.open_to_mentor,
    v.open_to_invest,
    v.open_to_collaborate,
    v.skills,
    (
      CASE WHEN p_user_id IS NOT NULL THEN
        (CASE WHEN v.industry_name = v_user_industry THEN 3 ELSE 0 END) +
        (CASE WHEN v.city = v_user_city THEN 2 ELSE 0 END) +
        (CASE WHEN v.state = v_user_state THEN 1 ELSE 0 END) +
        (CASE WHEN v.country = v_user_country THEN 1 ELSE 0 END) +
        (
          SELECT COALESCE(COUNT(*), 0)::INT
          FROM unnest(v.skills) AS s(skill)
          WHERE s.skill = ANY(v_user_skills)
        )
      ELSE 0 END
    )::INT AS relevance_score
  FROM public.v_people_directory_enriched v
  WHERE
    (p_country IS NULL OR p_country = '' OR v.country ILIKE '%' || p_country || '%')
    AND (p_industry IS NULL OR p_industry = '' OR v.industry_name ILIKE '%' || p_industry || '%' OR v.industry_slug ILIKE '%' || p_industry || '%')
    AND (p_specialty IS NULL OR p_specialty = '' OR v.specialty_name ILIKE '%' || p_specialty || '%' OR v.specialty_slug ILIKE '%' || p_specialty || '%')
    AND (p_mentor_only = FALSE OR v.open_to_mentor = TRUE)
    AND (p_open_to_work = FALSE OR v.open_to_work = TRUE)
    AND (p_open_to_hire = FALSE OR v.open_to_hire = TRUE)
    AND (p_open_to_invest = FALSE OR v.open_to_invest = TRUE)
    AND (p_open_to_collaborate = FALSE OR v.open_to_collaborate = TRUE)
    -- Skills filter: profile must have at least one of the requested skills
    AND (p_skills IS NULL OR array_length(p_skills, 1) IS NULL OR v.skills && p_skills)
  ORDER BY
    relevance_score DESC,
    v.full_name ASC;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_people_directory_scored(UUID, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT[]) TO anon, authenticated;
