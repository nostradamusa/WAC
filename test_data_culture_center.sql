-- Create or update the Albanian American Cultural Center with a rich profile
DO $$
DECLARE
  org_id UUID;
BEGIN
  -- First try to find existing organization
  SELECT id INTO org_id 
  FROM public.organizations 
  WHERE name ILIKE '%Albanian American%' AND city ILIKE '%Riverdale%' 
  LIMIT 1;

  IF org_id IS NULL THEN
    -- If it doesn't exist, create it
    INSERT INTO public.organizations (
      name, slug, description, organization_type, country, state, city, website, contact_email, is_public, is_verified,
      google_maps_url, google_rating, google_reviews_count, wac_rating, wac_reviews_count
    ) VALUES (
      'Albanian American Cultural Center',
      'albanian-american-cultural-center-nj',
      'The Albanian American Cultural Center in Riverdale, NJ is dedicated to preserving and promoting Albanian heritage, culture, and language. We host community events, educational programs, traditional dance classes, and serve as a central gathering place for the Albanian-American community in Northern New Jersey. Our facility includes a banquet hall, classrooms, and community spaces designed to keep our rich traditions alive for future generations.',
      'Cultural Center',
      'United States',
      'New Jersey',
      'Riverdale',
      'https://www.facebook.com/aaccnj/',
      'info@aaccnj.org',
      true,
      true,
      'https://www.google.com/maps/place/Albanian+American+Cultural+Center/@40.9996726,-74.3160408,17z/',
      4.8,
      37,
      NULL,
      0
    ) RETURNING id INTO org_id;
  ELSE
    -- If it does exist, update it with rich data
    UPDATE public.organizations SET
      description = 'The Albanian American Cultural Center in Riverdale, NJ is dedicated to preserving and promoting Albanian heritage, culture, and language. We host community events, educational programs, traditional dance classes, and serve as a central gathering place for the Albanian-American community in Northern New Jersey. Our facility includes a banquet hall, classrooms, and community spaces designed to keep our rich traditions alive for future generations.',
      organization_type = 'Cultural Center',
      website = 'https://www.facebook.com/aaccnj/',
      contact_email = 'info@aaccnj.org',
      is_public = true,
      is_verified = true,
      google_maps_url = 'https://www.google.com/maps/place/Albanian+American+Cultural+Center/@40.9996726,-74.3160408,17z/',
      google_rating = 4.8,
      google_reviews_count = 37,
      wac_rating = NULL,
      wac_reviews_count = 0
    WHERE id = org_id;
  END IF;

END $$;
