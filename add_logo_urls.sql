-- Add logo_url to entities
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- We should also update the views to include logo_url so the directory can use them later
DROP VIEW IF EXISTS public.businesses_directory_v1;
CREATE OR REPLACE VIEW public.businesses_directory_v1 AS
SELECT
  b.id,
  b.owner_id,
  b.name,
  b.slug,
  b.description,
  b.logo_url,
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
  public.businesses b
  LEFT JOIN public.industries i ON b.industry_id = i.id
WHERE
  b.is_public = true;
