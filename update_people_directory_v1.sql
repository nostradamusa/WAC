-- We need to DROP the view first because changing column data types or order 
-- isn't allowed with just 'CREATE OR REPLACE'.
DROP VIEW IF EXISTS people_directory_v1;

CREATE VIEW people_directory_v1 AS
SELECT
  p.id,
  p.username,
  p.full_name,
  p.headline,
  p.company,
  p.bio,
  p.country,
  p.state,
  p.city,
  p.ancestry_country,
  p.ancestry_city,
  p.ancestry_village,
  p.avatar_url,
  p.website,
  p.linkedin,
  p.is_verified,
  p.open_to_work,
  p.open_to_hire,
  p.open_to_mentor,
  p.open_to_invest,
  p.open_to_collaborate,
  
  i.name AS industry_name,
  i.slug AS industry_slug,
  
  -- Notice we add the 'profession' (the id itself) to match the previous shape 
  -- but we use the new `profession_id` join logic.
  pr.id::text AS profession,
  pr.name AS profession_name,
  pr.slug AS profession_slug,
  
  sp.name AS specialty_name,
  sp.slug AS specialty_slug,
  
  (
    SELECT array_agg(s.name)
    FROM profile_skills ps
    JOIN skills s ON ps.skill_id = s.id
    WHERE ps.profile_id = p.id
  ) AS skills

FROM profiles p
LEFT JOIN industries i ON p.industry_id = i.id
LEFT JOIN professions pr ON p.profession_id = pr.id
LEFT JOIN specialties sp ON p.specialty_id = sp.id
WHERE p.is_public = true;
