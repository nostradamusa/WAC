-- ==========================================
-- WAC People Directory Relevance Search RPC with PostGIS Proximity
-- ==========================================

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
  p_search_query TEXT DEFAULT NULL
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
  lat NUMERIC,
  lng NUMERIC,
  relevance_score INT
) AS $$
DECLARE
  v_user_industry TEXT;
  v_user_city TEXT;
  v_user_state TEXT;
  v_user_country TEXT;
  v_user_skills TEXT[];
  v_query_geom geometry(Point, 4326) := NULL;
BEGIN
  -- Get the current user's profile data if a user ID is provided
  IF p_user_id IS NOT NULL THEN
    SELECT 
      pd.industry_name, pd.city, pd.state, pd.country, pd.skills
    INTO
      v_user_industry, v_user_city, v_user_state, v_user_country, v_user_skills
    FROM public.people_directory_v1 pd
    WHERE pd.user_id = p_user_id;
  END IF;

  -- If a text search is provided, try to extract a city mention from it to serve as the geometric center
  IF p_search_query IS NOT NULL AND p_search_query != '' THEN
    SELECT geom INTO v_query_geom
    FROM public.wac_cities
    WHERE p_search_query ILIKE '%' || city_name || '%'
    ORDER BY LENGTH(city_name) DESC
    LIMIT 1;
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
    v.lat,
    v.lng,
    (
      -- Calculate relevance score based on Intelligence Network weighting
      (CASE WHEN p_user_id IS NOT NULL THEN
        (CASE WHEN v.industry_name = v_user_industry THEN 3 ELSE 0 END) +
        (CASE WHEN v.city = v_user_city THEN 2 ELSE 0 END) +
        (CASE WHEN v.state = v_user_state THEN 1 ELSE 0 END) +
        (CASE WHEN v.country = v_user_country THEN 1 ELSE 0 END) +
        (
          SELECT COALESCE(COUNT(*), 0)::INT
          FROM unnest(v.skills) AS s(skill)
          WHERE s.skill = ANY(v_user_skills)
        )
      ELSE 0 END)
      +
      -- 50-mile (80467 meters) Proximity Boost! 
      (CASE 
        WHEN v_query_geom IS NOT NULL AND v.geom IS NOT NULL AND ST_DWithin(v.geom, v_query_geom, 80467) THEN 100 
        ELSE 0 
      END)
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
  ORDER BY 
    relevance_score DESC,
    v.full_name ASC;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
