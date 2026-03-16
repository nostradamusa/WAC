-- Create a secure read-only view for the organizations directory
CREATE OR REPLACE VIEW public.organizations_directory_v1 AS
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
    o.created_at
FROM public.organizations o
WHERE o.is_public = true;

-- Grant access to the authenticated and anonymous roles so the frontend can query it
GRANT SELECT ON public.organizations_directory_v1 TO anon, authenticated;
