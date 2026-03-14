-- View combining people_directory_v1 and profile_experiences to fetch current company/title natively.
CREATE OR REPLACE VIEW v_people_directory_enriched AS
SELECT
  p.*,
  COALESCE(e.company, p.company) AS current_company_coalesced,
  COALESCE(e.title, p.headline) AS current_title_coalesced,
  -- We'll just leave them cleanly separated so the JS layer doesn't need to guess
  e.company AS exp_company,
  e.title AS exp_title
FROM
  people_directory_v1 p
LEFT JOIN (
  -- Grab only the most recent 'current' experience for each profile
  SELECT DISTINCT ON (profile_id)
    profile_id,
    company,
    title
  FROM
    profile_experiences
  WHERE
    is_current = true
  ORDER BY
    profile_id,
    start_date DESC
) e ON p.id = e.profile_id;
