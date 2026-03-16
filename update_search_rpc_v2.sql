-- Drop the existing function first
DROP FUNCTION IF EXISTS search_people_directory_v1;

-- Re-create the search function to include the new boolean flags
CREATE OR REPLACE FUNCTION search_people_directory_v1(
  search_query text DEFAULT '',
  p_country text DEFAULT '',
  p_industry text DEFAULT '',
  p_specialty text DEFAULT '',
  p_mentor_only boolean DEFAULT false,
  p_open_to_work boolean DEFAULT false,
  p_open_to_hire boolean DEFAULT false
) RETURNS SETOF v_people_directory_enriched AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM v_people_directory_enriched p
  WHERE
    -- 1. Search Query Match
    (
      search_query = '' OR
      p.full_name ILIKE '%' || search_query || '%' OR
      p.current_company_coalesced ILIKE '%' || search_query || '%' OR
      p.current_title_coalesced ILIKE '%' || search_query || '%' OR
      p.city ILIKE '%' || search_query || '%' OR
      p.country ILIKE '%' || search_query || '%' OR
      p.industry_name ILIKE '%' || search_query || '%' OR
      p.specialty_name ILIKE '%' || search_query || '%'
    )
    -- 2. Country Filter Match
    AND (
      p_country = '' OR
      p.country ILIKE p_country
    )
    -- 3. Industry Filter Match
    AND (
      p_industry = '' OR
      p.industry_name ILIKE p_industry
    )
    -- 4. Specialty Filter Match
    AND (
      p_specialty = '' OR
      p.specialty_name ILIKE p_specialty
    )
    -- 5. Mentor Check
    AND (
      p_mentor_only = false OR
      p.mentorship_status = 'Open to mentoring'
    )
    -- 6. Open to Work Check
    AND (
      p_open_to_work = false OR
      p.open_to_work = true
    )
    -- 7. Hiring Check
    AND (
      p_open_to_hire = false OR
      p.open_to_hire = true
    );
END;
$$ LANGUAGE plpgsql STABLE;
