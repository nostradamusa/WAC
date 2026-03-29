-- Enable unaccent extension for diacritics-insensitive city matching
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

-- Batch city coordinate resolver with accent-insensitive + prefix matching.
-- Called from batchResolveCities() in lib/geo/coordinates.ts.
--
-- Resolution tiers (per city):
--   Tier 1: exact accent-insensitive match (unaccent both sides)
--   Tier 2: prefix match — input is prefix of DB name (handles truncation)
--   Tier 3: fuzzy suffix — drop last char for variant endings (ë→a)
--
-- All tiers constrain by country_name (hard constraint).
CREATE OR REPLACE FUNCTION resolve_city_batch(
  p_cities text[],
  p_countries text[]
)
RETURNS TABLE(idx int, lat numeric, lng numeric) AS $$
DECLARE
  i int;
  city_raw text;
  country_raw text;
  found_lat numeric;
  found_lng numeric;
  search_key text;
BEGIN
  FOR i IN 1..coalesce(array_length(p_cities, 1), 0) LOOP
    city_raw    := p_cities[i];
    country_raw := p_countries[i];
    found_lat   := NULL;
    found_lng   := NULL;

    search_key := extensions.unaccent(lower(trim(city_raw)));

    -- Tier 1: exact accent-insensitive match
    SELECT w.lat, w.lng INTO found_lat, found_lng
    FROM wac_cities w
    WHERE extensions.unaccent(lower(w.city_name)) = search_key
      AND w.country_name = country_raw
    LIMIT 1;

    -- Tier 2: prefix match (input is prefix of DB name)
    -- Handles truncated input like "Sarand" matching "Sarande"
    IF found_lat IS NULL AND length(search_key) >= 4 THEN
      SELECT w.lat, w.lng INTO found_lat, found_lng
      FROM wac_cities w
      WHERE extensions.unaccent(lower(w.city_name)) LIKE search_key || '%'
        AND w.country_name = country_raw
      ORDER BY length(w.city_name)
      LIMIT 1;
    END IF;

    -- Tier 3: fuzzy suffix — drop last 1-2 chars for variant endings (ë→a)
    -- Handles "Tirane" matching "Tirana" via "Tiran%" prefix
    IF found_lat IS NULL AND length(search_key) >= 5 THEN
      SELECT w.lat, w.lng INTO found_lat, found_lng
      FROM wac_cities w
      WHERE extensions.unaccent(lower(w.city_name)) LIKE left(search_key, length(search_key) - 1) || '%'
        AND w.country_name = country_raw
      ORDER BY length(w.city_name)
      LIMIT 1;
    END IF;

    IF found_lat IS NOT NULL THEN
      idx := i;
      lat := found_lat;
      lng := found_lng;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;
