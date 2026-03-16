-- Creates or replaces the businesses directory view for Phase 2
-- This safely joins the businesses table with the structured industries taxonomy

DROP VIEW IF EXISTS businesses_directory_v1;

CREATE OR REPLACE VIEW businesses_directory_v1 AS
SELECT
  b.id,
  b.owner_id,
  b.name,
  b.slug,
  b.description,
  b.industry_id,
  i.name AS industry_name,
  i.slug AS industry_slug,
  b.business_type,
  b.country,
  b.state,
  b.city,
  b.website,
  b.linkedin,
  b.instagram,
  b.phone,
  b.email,
  b.employee_count_range,
  b.founded_year,
  b.hiring_status,
  b.is_public,
  b.is_verified,
  b.created_at,
  b.updated_at
FROM
  businesses b
  LEFT JOIN industries i ON b.industry_id = i.id
WHERE
  b.is_public = true;
