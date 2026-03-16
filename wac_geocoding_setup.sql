-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Create wac_cities table
CREATE TABLE IF NOT EXISTS public.wac_cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name TEXT NOT NULL,
    state_name TEXT,
    country_name TEXT,
    lat NUMERIC,
    lng NUMERIC,
    geom geometry(Point, 4326)
);
CREATE INDEX IF NOT EXISTS idx_wac_cities_name ON public.wac_cities (city_name, country_name);
CREATE INDEX IF NOT EXISTS idx_wac_cities_geom ON public.wac_cities USING GIST (geom);

-- Trigger to auto-generate geom from lat/lng on wac_cities
CREATE OR REPLACE FUNCTION trigger_generate_wac_city_geom()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_city_geom ON public.wac_cities;
CREATE TRIGGER trg_generate_city_geom
BEFORE INSERT OR UPDATE OF lat, lng ON public.wac_cities
FOR EACH ROW EXECUTE FUNCTION trigger_generate_wac_city_geom();

-- 2. Add coordinate columns to base tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lng NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS lng NUMERIC;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS lng NUMERIC;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

-- Spatial Indexes on Base Tables
CREATE INDEX IF NOT EXISTS idx_profiles_geom ON public.profiles USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_businesses_geom ON public.businesses USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_organizations_geom ON public.organizations USING GIST (geom);

-- 3. Recreate the Views to include the coordinate columns

-- Drop dependent view first
DROP VIEW IF EXISTS public.v_people_directory_enriched CASCADE;

DROP VIEW IF EXISTS public.people_directory_v1 CASCADE;
CREATE VIEW public.people_directory_v1 AS
SELECT
  p.id, p.username, p.full_name, p.headline, p.company, p.bio,
  p.country, p.state, p.city, p.ancestry_country, p.ancestry_city, p.ancestry_village,
  p.avatar_url, p.website, p.linkedin, p.is_verified, p.open_to_work, p.open_to_hire,
  p.open_to_mentor, p.open_to_invest, p.open_to_collaborate,
  p.lat, p.lng, p.geom, -- New Coordinate Columns!
  i.name AS industry_name, i.slug AS industry_slug,
  pr.id::text AS profession, pr.name AS profession_name, pr.slug AS profession_slug,
  sp.name AS specialty_name, sp.slug AS specialty_slug,
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

DROP VIEW IF EXISTS public.businesses_directory_v1 CASCADE;
CREATE VIEW public.businesses_directory_v1 AS
SELECT
  b.id, b.owner_id, b.name, b.slug, b.description, b.industry_id,
  i.name AS industry_name, i.slug AS industry_slug,
  b.business_type, b.country, b.state, b.city, b.website,
  b.linkedin, b.instagram, b.phone, b.email, b.employee_count_range,
  b.founded_year, b.hiring_status, b.is_public, b.is_verified,
  b.created_at, b.updated_at,
  b.lat, b.lng, b.geom -- New Coordinate Columns!
FROM businesses b
LEFT JOIN industries i ON b.industry_id = i.id
WHERE b.is_public = true;

DROP VIEW IF EXISTS public.organizations_directory_v1 CASCADE;
CREATE VIEW public.organizations_directory_v1 AS
SELECT
  o.id, o.name, o.slug, o.description, o.organization_type,
  o.country, o.state, o.city, o.website, o.contact_email,
  o.leader_name, o.is_verified, o.created_at,
  o.lat, o.lng, o.geom -- New Coordinate Columns!
FROM organizations o
WHERE o.is_public = true;

-- 4. Recreate v_people_directory_enriched view
CREATE VIEW public.v_people_directory_enriched AS
SELECT
  p.*,
  COALESCE(e.company, p.company) AS current_company_coalesced,
  COALESCE(e.title, p.headline) AS current_title_coalesced,
  e.company AS exp_company,
  e.title AS exp_title
FROM
  public.people_directory_v1 p
LEFT JOIN (
  SELECT DISTINCT ON (profile_id)
    profile_id, company, title
  FROM profile_experiences
  WHERE is_current = true
  ORDER BY profile_id, start_date DESC
) e ON p.id = e.profile_id;

-- 5. Geocoding Trigger Function
CREATE OR REPLACE FUNCTION trigger_geocode_directory_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_geom geometry(Point, 4326);
  v_lat NUMERIC;
  v_lng NUMERIC;
BEGIN
  IF NEW.city IS NOT NULL AND NEW.country IS NOT NULL THEN
    SELECT geom, lat, lng INTO v_geom, v_lat, v_lng
    FROM public.wac_cities
    WHERE city_name ILIKE NEW.city AND country_name ILIKE NEW.country
    LIMIT 1;

    IF FOUND THEN
      NEW.geom := v_geom;
      NEW.lat := v_lat;
      NEW.lng := v_lng;
    ELSE
      SELECT geom, lat, lng INTO v_geom, v_lat, v_lng
      FROM public.wac_cities
      WHERE city_name ILIKE NEW.city
      LIMIT 1;
      
      IF FOUND THEN
        NEW.geom := v_geom;
        NEW.lat := v_lat;
        NEW.lng := v_lng;
      END IF;
    END IF;
  ELSIF NEW.city IS NOT NULL THEN
      SELECT geom, lat, lng INTO v_geom, v_lat, v_lng
      FROM public.wac_cities
      WHERE city_name ILIKE NEW.city
      LIMIT 1;
      
      IF FOUND THEN
        NEW.geom := v_geom;
        NEW.lat := v_lat;
        NEW.lng := v_lng;
      END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach trigger to BASE TABLES
DROP TRIGGER IF EXISTS trg_geocode_people ON public.profiles;
CREATE TRIGGER trg_geocode_people
BEFORE INSERT OR UPDATE OF city, state, country
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_geocode_directory_entry();

DROP TRIGGER IF EXISTS trg_geocode_businesses ON public.businesses;
CREATE TRIGGER trg_geocode_businesses
BEFORE INSERT OR UPDATE OF city, state, country
ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION trigger_geocode_directory_entry();

DROP TRIGGER IF EXISTS trg_geocode_organizations ON public.organizations;
CREATE TRIGGER trg_geocode_organizations
BEFORE INSERT OR UPDATE OF city, state, country
ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION trigger_geocode_directory_entry();

-- Grant permissions back to APIs
GRANT SELECT ON public.people_directory_v1 TO anon, authenticated;
GRANT SELECT ON public.businesses_directory_v1 TO anon, authenticated;
GRANT SELECT ON public.organizations_directory_v1 TO anon, authenticated;
GRANT SELECT ON public.v_people_directory_enriched TO anon, authenticated;
