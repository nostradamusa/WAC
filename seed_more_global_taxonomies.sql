-- Massive Global Taxonomy Seed Script (Expanded Edition)
-- This script contains an exhaustive list of industries, professions, and specialties.

CREATE OR REPLACE FUNCTION slugify(value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(value, '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$ 
DECLARE
    v_industry_id UUID;
    v_profession_id UUID;
    spec RECORD;
BEGIN

    --------------------------------------------------------------------------------
    -- 7. Education & Academia
    --------------------------------------------------------------------------------
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Education & Academia');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Education & Academia', slugify('Education & Academia')) RETURNING id INTO v_industry_id;
    END IF;

    -- Professor
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Professor / Academic') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Professor / Academic', slugify('Professor / Academic'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('STEM Research'), ('Humanities'), ('Business & Economics'), ('Medical Sciences')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Teacher (K-12)
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Teacher (K-12)') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Teacher (K-12)', slugify('Teacher (K-12)'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Primary Education'), ('Secondary Education'), ('Special Education'), ('ESL / Bilingual Education')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    --------------------------------------------------------------------------------
    -- 8. Government & Public Administration
    --------------------------------------------------------------------------------
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Government & Public Administration');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Government & Public Administration', slugify('Government & Public Administration')) RETURNING id INTO v_industry_id;
    END IF;

    -- Diplomat / Foreign Service
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Diplomat / Foreign Service') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Diplomat / Foreign Service', slugify('Diplomat / Foreign Service'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('International Relations'), ('Trade Policy'), ('Consular Affairs')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Law Enforcement / Security
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Law Enforcement & Security') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Law Enforcement & Security', slugify('Law Enforcement & Security'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Police Officer'), ('Intelligence Analyst'), ('Cybersecurity'), ('Private Security')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    --------------------------------------------------------------------------------
    -- 9. Retail, Consumer Goods & E-Commerce
    --------------------------------------------------------------------------------
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Retail & Consumer Goods');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Retail & Consumer Goods', slugify('Retail & Consumer Goods')) RETURNING id INTO v_industry_id;
    END IF;

    -- E-Commerce Manager
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('E-Commerce Strategy & Ops') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('E-Commerce Strategy & Ops', slugify('E-Commerce Strategy & Ops'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Supply Chain'), ('Merchandising'), ('Digital Marketing'), ('Marketplace Management')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Store Manager
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Retail Operations') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Retail Operations', slugify('Retail Operations'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Luxury Goods'), ('Apparel & Fashion'), ('Electronics'), ('FMCG')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    --------------------------------------------------------------------------------
    -- 10. Logistics, Transportation & Supply Chain
    --------------------------------------------------------------------------------
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Logistics & Supply Chain');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Logistics & Supply Chain', slugify('Logistics & Supply Chain')) RETURNING id INTO v_industry_id;
    END IF;

    -- Supply Chain Manager
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Supply Chain Manager') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Supply Chain Manager', slugify('Supply Chain Manager'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Procurement'), ('Inventory Planning'), ('Global Trade Compliance')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Commercial Driver / Pilot
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Commercial Transport Operator') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Commercial Transport Operator', slugify('Commercial Transport Operator'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Commercial Airline Pilot'), ('Maritime Shipping'), ('Freight Trucking'), ('Rail Operations')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    --------------------------------------------------------------------------------
    -- 11. Hospitality, Tourism & Food Services
    --------------------------------------------------------------------------------
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Hospitality & Tourism');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Hospitality & Tourism', slugify('Hospitality & Tourism')) RETURNING id INTO v_industry_id;
    END IF;

    -- Chef / Culinary Professional
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Culinary Professional') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Culinary Professional', slugify('Culinary Professional'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Executive Chef'), ('Pastry Chef'), ('Restaurant Management'), ('Catering')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Hotel Management
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Hospitality Management') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Hospitality Management', slugify('Hospitality Management'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Luxury Hotels'), ('Event Planning'), ('Travel Agency'), ('Guest Relations')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    --------------------------------------------------------------------------------
    -- 12. Energy, Mining & Utilities
    --------------------------------------------------------------------------------
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Energy & Utilities');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Energy & Utilities', slugify('Energy & Utilities')) RETURNING id INTO v_industry_id;
    END IF;

    -- Energy Engineer
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Energy Engineer') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Energy Engineer', slugify('Energy Engineer'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Renewable Energy (Solar/Wind)'), ('Oil & Gas'), ('Nuclear Energy'), ('Grid Modernization')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    --------------------------------------------------------------------------------
    -- 13. Nonprofit, NGO & Philanthropy
    --------------------------------------------------------------------------------
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Nonprofit & NGO');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Nonprofit & NGO', slugify('Nonprofit & NGO')) RETURNING id INTO v_industry_id;
    END IF;

    -- Social Worker / Community Organizer
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Social & Community Work') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Social & Community Work', slugify('Social & Community Work'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('NGO Management'), ('Fundraising & Development'), ('Human Rights'), ('Global Health Initiatives')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    --------------------------------------------------------------------------------
    -- 14. Manufacturing & Industrial
    --------------------------------------------------------------------------------
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Manufacturing & Industrial');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Manufacturing & Industrial', slugify('Manufacturing & Industrial')) RETURNING id INTO v_industry_id;
    END IF;

    -- Industrial Engineer
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Industrial & Manufacturing Engineer') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Industrial & Manufacturing Engineer', slugify('Industrial & Manufacturing Engineer'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Production Planning'), ('Quality Control'), ('Robotics & Automation'), ('Lean Manufacturing')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

END $$;
