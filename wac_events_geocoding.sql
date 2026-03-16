-- ==========================================
-- WAC Events Geocoding & Relevance Search RPC
-- ==========================================

-- 1. Add PostGIS geometry columns to events table if they don't exist
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS lat NUMERIC,
ADD COLUMN IF NOT EXISTS lng NUMERIC,
ADD COLUMN IF NOT EXISTS geom geography(Point, 4326);

CREATE INDEX IF NOT EXISTS idx_events_geom ON public.events USING GIST (geom);

-- 2. Trigger to auto-geocode events based on city/country match in wac_cities
CREATE OR REPLACE FUNCTION geocode_event_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_lat NUMERIC;
  v_lng NUMERIC;
  v_geom GEOGRAPHY(Point, 4326);
BEGIN
  -- Simple match by city name and optionally country
  SELECT lat, lng, geom
  INTO v_lat, v_lng, v_geom
  FROM public.wac_cities
  WHERE city_name = NEW.city 
    AND (NEW.country IS NULL OR country_name = NEW.country)
  LIMIT 1;

  IF FOUND THEN
    NEW.lat := v_lat;
    NEW.lng := v_lng;
    NEW.geom := v_geom;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_geocode_event ON public.events;
CREATE TRIGGER trg_geocode_event
BEFORE INSERT OR UPDATE OF city, country ON public.events
FOR EACH ROW EXECUTE FUNCTION geocode_event_entry();

-- 3. Force re-calculation of geom for existing events
UPDATE public.events SET city = city WHERE city IS NOT NULL;

-- 4. Create RPC to search and rank events
CREATE OR REPLACE FUNCTION get_events_scored(
  p_search_query TEXT DEFAULT NULL,
  p_user_lat NUMERIC DEFAULT NULL,  -- Provided from mock frontend location services
  p_user_lng NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  organization_id UUID,
  location_name TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  event_type TEXT,
  visibility TEXT,
  lat NUMERIC,
  lng NUMERIC,
  distance_meters NUMERIC,
  relevance_score INT
) AS $$
DECLARE
  v_user_geom geography(Point, 4326) := NULL;
  v_query_geom geography(Point, 4326) := NULL;
BEGIN
  -- Construct user geometry if provided
  IF p_user_lat IS NOT NULL AND p_user_lng IS NOT NULL THEN
    v_user_geom := ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography;
  END IF;

  -- If a text search is provided, try to extract a city mention from it to serve as query geom (second fallback)
  IF p_search_query IS NOT NULL AND p_search_query != '' THEN
    SELECT geom INTO v_query_geom
    FROM public.wac_cities
    WHERE p_search_query ILIKE '%' || city_name || '%'
    ORDER BY LENGTH(city_name) DESC
    LIMIT 1;
  END IF;

  RETURN QUERY
  SELECT 
    e.id,
    e.title::TEXT,
    e.description::TEXT,
    e.organization_id,
    e.location_name::TEXT,
    e.city::TEXT,
    e.state::TEXT,
    e.country::TEXT,
    e.start_time,
    e.end_time,
    e.event_type::TEXT,
    e.visibility::TEXT,
    e.lat,
    e.lng,
    -- Distance to user (or searched city), NULL if neither is known
    (CASE 
        WHEN v_user_geom IS NOT NULL AND e.geom IS NOT NULL THEN ST_Distance(e.geom, v_user_geom)
        WHEN v_query_geom IS NOT NULL AND e.geom IS NOT NULL THEN ST_Distance(e.geom, v_query_geom)
        ELSE NULL
    END)::NUMERIC AS distance_meters,
    (
      -- Text match score
      (CASE 
        WHEN p_search_query IS NOT NULL AND p_search_query != '' THEN
          (CASE WHEN e.title ILIKE '%' || p_search_query || '%' THEN 10 ELSE 0 END) +
          (CASE WHEN e.event_type ILIKE '%' || p_search_query || '%' THEN 5 ELSE 0 END) +
          (CASE WHEN e.city ILIKE '%' || p_search_query || '%' THEN 5 ELSE 0 END)
        ELSE 0
      END)
      +
      -- Proximity Boost
      (CASE 
        WHEN v_user_geom IS NOT NULL AND e.geom IS NOT NULL AND ST_DWithin(e.geom, v_user_geom, 80467) THEN 50 -- Within 50 miles of user
        WHEN v_query_geom IS NOT NULL AND e.geom IS NOT NULL AND ST_DWithin(e.geom, v_query_geom, 80467) THEN 50 -- Within 50 miles of searched city
        ELSE 0 
      END)
    )::INT AS relevance_score
  FROM public.events e
  WHERE 
    e.visibility = 'Public'
    AND (
      p_search_query IS NULL 
      OR p_search_query = '' 
      OR e.title ILIKE '%' || p_search_query || '%'
      OR e.description ILIKE '%' || p_search_query || '%'
      OR e.city ILIKE '%' || p_search_query || '%'
      OR e.state ILIKE '%' || p_search_query || '%'
      OR e.country ILIKE '%' || p_search_query || '%'
      OR e.event_type ILIKE '%' || p_search_query || '%'
    )
  ORDER BY 
    relevance_score DESC,
    distance_meters ASC NULLS LAST, -- Prioritize closest events first
    e.start_time ASC;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
