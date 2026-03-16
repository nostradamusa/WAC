-- Create the WAC reviews table
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

-- Add WAC rating aggregates to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS wac_rating NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS wac_reviews_count INTEGER DEFAULT 0;

-- Add WAC rating aggregates to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS wac_rating NUMERIC(3, 2),
  ADD COLUMN IF NOT EXISTS wac_reviews_count INTEGER DEFAULT 0;

-- Drop dependent views first
DROP VIEW IF EXISTS public.businesses_directory_v1;

-- Recreate businesses view
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

-- Enable RLS on reviews
ALTER TABLE public.wac_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
CREATE POLICY "Reviews are viewable by everyone."
  ON public.wac_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own reviews."
  ON public.wac_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews."
  ON public.wac_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete own reviews."
  ON public.wac_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- ADD TEST DATA FOR WAC REVIEWS
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
