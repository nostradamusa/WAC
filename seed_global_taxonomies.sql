-- Mass Seed of Global Industries, Professions, and Specialties
-- This script safely inserts data avoiding duplicates based on slugs.

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
    
    ind RECORD;
    prof RECORD;
    spec RECORD;
BEGIN
    -- 1. Healthcare
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Healthcare');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Healthcare', slugify('Healthcare')) RETURNING id INTO v_industry_id;
    END IF;

    -- Healthcare -> Physician
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Physician') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Physician', slugify('Physician'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Cardiology'), ('Dermatology'), ('Gastroenterology'), ('Neurology'), ('Oncology'), ('Pediatrics'), ('Psychiatry'), ('Surgery')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Healthcare -> Nurse
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Nurse') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Nurse', slugify('Nurse'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('ICU'), ('ER'), ('Pediatrics'), ('Oncology'), ('Surgical'), ('Labor and Delivery')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Healthcare -> NP / PA
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('NP / PA') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('NP / PA', slugify('NP / PA'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Family Medicine'), ('Emergency Medicine'), ('Surgery'), ('Primary Care')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Healthcare -> Pharmacist
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Pharmacist') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Pharmacist', slugify('Pharmacist'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Clinical'), ('Retail'), ('Hospital'), ('Compounding')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Healthcare -> Pharmaceutical Sales Representative
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Pharmaceutical Sales Representative') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Pharmaceutical Sales Representative', slugify('Pharmaceutical Sales Representative'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Primary Care'), ('Specialty'), ('Rare Disease'), ('Oncology Sales')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Healthcare -> Medical Device Sales Representative
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Medical Device Sales Representative') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Medical Device Sales Representative', slugify('Medical Device Sales Representative'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Surgical Instruments'), ('Implants'), ('Diagnostics'), ('Capital Equipment')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Healthcare -> Ambulatory / Medical Transportation
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Ambulatory / Medical Transportation') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Ambulatory / Medical Transportation', slugify('Ambulatory / Medical Transportation'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('NEMT (Non-Emergency)'), ('EMS (Emergency)'), ('Logistics Management'), ('Fleet Operations')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;


    -- 2. Technology & Engineering
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Technology & Engineering');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Technology & Engineering', slugify('Technology & Engineering')) RETURNING id INTO v_industry_id;
    END IF;

    -- Tech -> Software Engineer
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Software Engineer') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Software Engineer', slugify('Software Engineer'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Frontend'), ('Backend'), ('Full Stack'), ('Mobile'), ('DevOps'), ('Cloud Architecture')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Tech -> Data Scientist
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Data Scientist') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Data Scientist', slugify('Data Scientist'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Machine Learning'), ('Data Analytics'), ('Data Engineering'), ('Artificial Intelligence')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Tech -> Product Manager
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Product Manager') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Product Manager', slugify('Product Manager'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Technical PM'), ('Growth PM'), ('B2B SaaS'), ('Consumer Products')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;


    -- 3. Business & Finance
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Business & Finance');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Business & Finance', slugify('Business & Finance')) RETURNING id INTO v_industry_id;
    END IF;

    -- Finance -> Accountant
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Accountant') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Accountant', slugify('Accountant'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Tax'), ('Audit'), ('Corporate'), ('Forensic'), ('Bookkeeping')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Finance -> Investment Banker
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Investment Banker') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Investment Banker', slugify('Investment Banker'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('M&A'), ('Equity Capital Markets'), ('Debt Capital Markets'), ('Restructuring')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Business -> Sales Executive
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Sales Executive') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Sales Executive', slugify('Sales Executive'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('B2B Sales'), ('Enterprise Sales'), ('Account Management'), ('Channel Sales')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;


    -- 4. Law & Policy
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Law & Policy');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Law & Policy', slugify('Law & Policy')) RETURNING id INTO v_industry_id;
    END IF;

    -- Law -> Attorney
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Attorney') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Attorney', slugify('Attorney'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Corporate Law'), ('Criminal Defense'), ('Intellectual Property'), ('Real Estate Law'), ('Immigration Law'), ('Litigation'), ('Family Law')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Law -> Paralegal
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Paralegal') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Paralegal', slugify('Paralegal'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Litigation Support'), ('Corporate Compliance'), ('Contracts Administration')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;


    -- 5. Real Estate & Construction
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Real Estate & Construction');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Real Estate & Construction', slugify('Real Estate & Construction')) RETURNING id INTO v_industry_id;
    END IF;

    -- Real Estate -> Real Estate Agent
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Real Estate Agent') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Real Estate Agent', slugify('Real Estate Agent'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Residential'), ('Commercial'), ('Luxury Real Estate'), ('Property Management')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Construction -> Civil Engineer
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Civil Engineer') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Civil Engineer', slugify('Civil Engineer'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Structural'), ('Transportation'), ('Environmental'), ('Geotechnical')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Construction -> Construction Manager
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Construction Manager') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Construction Manager', slugify('Construction Manager'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Commercial Construction'), ('Residential Construction'), ('Infrastructure'), ('Project Estimating')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;


    -- 6. Creative & Media
    SELECT id INTO v_industry_id FROM public.industries WHERE slug = slugify('Creative & Media');
    IF NOT FOUND THEN
        INSERT INTO public.industries (name, slug) VALUES ('Creative & Media', slugify('Creative & Media')) RETURNING id INTO v_industry_id;
    END IF;

    -- Creative -> Graphic Designer
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Graphic Designer') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Graphic Designer', slugify('Graphic Designer'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Brand Identity'), ('Motion Graphics'), ('Print Design'), ('Web Design')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

    -- Media -> Journalist
    SELECT id INTO v_profession_id FROM public.professions WHERE slug = slugify('Journalist') AND industry_id = v_industry_id;
    IF NOT FOUND THEN
        INSERT INTO public.professions (name, slug, industry_id) VALUES ('Journalist', slugify('Journalist'), v_industry_id) RETURNING id INTO v_profession_id;
    END IF;
    FOR spec IN SELECT * FROM (VALUES ('Investigative'), ('Broadcast'), ('Photojournalism'), ('Editorial')) AS v(name) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.specialties WHERE slug = slugify(spec.name) AND industry_id = v_industry_id) THEN
            INSERT INTO public.specialties (name, slug, industry_id) VALUES (spec.name, slugify(spec.name), v_industry_id);
        END IF;
    END LOOP;

END $$;
