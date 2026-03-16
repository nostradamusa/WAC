-- 1. Drop views first so we can safely modify underlying tables
DROP VIEW IF EXISTS public.businesses_directory_v1;
DROP VIEW IF EXISTS public.organizations_directory_v1;

-- 2. Add WAC columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS wac_rating NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS wac_reviews_count INTEGER DEFAULT 0;

-- 3. Add WAC columns to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS wac_rating NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS wac_reviews_count INTEGER DEFAULT 0;

-- 4. Create wac_reviews table
CREATE TABLE IF NOT EXISTS public.wac_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  target_organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure a review must target exactly one entity type
  CONSTRAINT wac_reviews_target_check CHECK (
    (target_business_id IS NOT NULL AND target_organization_id IS NULL) OR
    (target_organization_id IS NOT NULL AND target_business_id IS NULL)
  ),
  
  -- Ensure a user can only review a specific entity once
  CONSTRAINT wac_reviews_business_unique UNIQUE (reviewer_id, target_business_id),
  CONSTRAINT wac_reviews_organization_unique UNIQUE (reviewer_id, target_organization_id)
);

-- Enable RLS on reviews
ALTER TABLE public.wac_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews (wrapped safely to prevent duplicate errors if run multiple times)
DO $$ 
BEGIN
  BEGIN
    CREATE POLICY "Reviews viewable by everyone" ON public.wac_reviews FOR SELECT USING (true);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  
  BEGIN
    CREATE POLICY "Users insert own reviews" ON public.wac_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  
  BEGIN
    CREATE POLICY "Users update own reviews" ON public.wac_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  
  BEGIN
    CREATE POLICY "Users delete own reviews" ON public.wac_reviews FOR DELETE USING (auth.uid() = reviewer_id);
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 5. Recreate businesses view with new columns
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
  b.google_reviews_count,
  b.wac_rating,
  b.wac_reviews_count
FROM 
  public.businesses b
LEFT JOIN 
  public.industries i ON b.industry_id = i.id;

GRANT SELECT ON public.businesses_directory_v1 TO anon, authenticated;

-- 6. Recreate organizations view with new columns
CREATE VIEW public.organizations_directory_v1 AS
SELECT
    o.id,
    o.name,
    o.slug,
    o.description,
    o.organization_type,
    o.country,
    o.state,
    o.city,
    o.website,
    o.contact_email,
    o.leader_name,
    o.is_verified,
    o.created_at,
    o.logo_url,
    o.google_maps_url,
    o.google_rating,
    o.google_reviews_count,
    o.wac_rating,
    o.wac_reviews_count
FROM public.organizations o
WHERE o.is_public = true;

GRANT SELECT ON public.organizations_directory_v1 TO anon, authenticated;

-- 7. Add Test Data
UPDATE public.organizations SET 
  wac_rating = 4.7,
  wac_reviews_count = 12
WHERE id IN (
  SELECT id FROM public.organizations WHERE name ILIKE '%Albanian Roots%' LIMIT 1
);

UPDATE public.businesses SET 
  wac_rating = 5.0,
  wac_reviews_count = 34
WHERE id IN (
  SELECT id FROM public.businesses LIMIT 3
);
