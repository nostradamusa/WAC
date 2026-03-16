-- Fix organizations view
DROP VIEW IF EXISTS public.organizations_directory_v1;

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
