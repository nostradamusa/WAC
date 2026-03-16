-- Add Google Maps fields to businesses
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS google_rating NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER;

-- Add Google Maps fields to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS google_rating NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER;

-- Update businesses_directory_v1 view
DROP VIEW IF EXISTS public.businesses_directory_v1;
CREATE VIEW public.businesses_directory_v1 AS
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
  b.updated_at,
  b.logo_url,
  b.google_maps_url,
  b.google_rating,
  b.google_reviews_count
FROM 
  public.businesses b
LEFT JOIN 
  public.industries i ON b.industry_id = i.id;

-- Ensure an organizations_directory view exists or we can just query directly
-- It appears we query the organizations table directly in searchService.ts currently,
-- but if a view exists, we should update it.
-- Based on the schema provided we'll add some dummy data for Google Ratings so we can test it immediately.

UPDATE public.businesses SET 
  google_maps_url = 'https://maps.google.com/?q=Tirana+Albania',
  google_rating = 4.8,
  google_reviews_count = 124
WHERE id IN (
  SELECT id FROM public.businesses LIMIT 3
);

UPDATE public.organizations SET 
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Albanian+Roots+New+York',
  google_rating = 4.9,
  google_reviews_count = 142
WHERE id IN (
  SELECT id FROM public.organizations WHERE name ILIKE '%Albanian Roots%' LIMIT 1
);
