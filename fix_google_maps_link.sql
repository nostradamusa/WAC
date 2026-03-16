UPDATE public.organizations SET 
  google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Albanian+Roots+New+York'
WHERE id IN (
  SELECT id FROM public.organizations WHERE name ILIKE '%Albanian Roots%' LIMIT 1
);
