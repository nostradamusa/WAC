-- Mock Data for WAC Directory Testing
-- This script safely inserts fake businesses and organizations for testing the directory search.

-- 1. Ensure we have some basic industries to link businesses to
INSERT INTO industries (name, slug)
SELECT 'Technology', 'technology' WHERE NOT EXISTS (SELECT 1 FROM industries WHERE slug = 'technology');

INSERT INTO industries (name, slug)
SELECT 'Healthcare', 'healthcare' WHERE NOT EXISTS (SELECT 1 FROM industries WHERE slug = 'healthcare');

INSERT INTO industries (name, slug)
SELECT 'Finance', 'finance' WHERE NOT EXISTS (SELECT 1 FROM industries WHERE slug = 'finance');

INSERT INTO industries (name, slug)
SELECT 'Hospitality', 'hospitality' WHERE NOT EXISTS (SELECT 1 FROM industries WHERE slug = 'hospitality');


-- 2. Insert fake businesses
DO $$
DECLARE
    tech_industry_id uuid;
    health_industry_id uuid;
BEGIN
    SELECT id INTO tech_industry_id FROM industries WHERE slug = 'technology' LIMIT 1;
    SELECT id INTO health_industry_id FROM industries WHERE slug = 'healthcare' LIMIT 1;

    IF NOT EXISTS (SELECT 1 FROM businesses WHERE slug = 'illyrian-software') THEN
        INSERT INTO businesses (name, slug, description, industry_id, business_type, country, city, website, is_public, is_verified)
        VALUES ('Illyrian Software', 'illyrian-software', 'A cutting-edge software development agency specializing in AI and web applications.', tech_industry_id, 'B2B', 'Albania', 'Tirana', 'https://example.com', true, true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM businesses WHERE slug = 'pristina-innovators') THEN
        INSERT INTO businesses (name, slug, description, industry_id, business_type, country, city, website, is_public, is_verified)
        VALUES ('Pristina Innovators', 'pristina-innovators', 'Venture lab and startup accelerator looking for new technology investments.', tech_industry_id, 'Investment', 'Kosovo', 'Pristina', 'https://example.com', true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM businesses WHERE slug = 'dardanian-health') THEN
        INSERT INTO businesses (name, slug, description, industry_id, business_type, country, city, website, is_public, is_verified)
        VALUES ('Dardanian Health Solutions', 'dardanian-health', 'Providing modern medical equipment to clinics across the Balkans.', health_industry_id, 'B2B', 'North Macedonia', 'Skopje', 'https://example.com', true, true);
    END IF;
END $$;


-- 3. Insert fake organizations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'albanian-roots') THEN
        INSERT INTO organizations (name, slug, description, organization_type, country, city, website, is_public, is_verified)
        VALUES ('Albanian Roots', 'albanian-roots', 'A cultural non-profit preserving Albanian heritage and organizing community events.', 'Association', 'United States', 'New York', 'https://albanianroots.org', true, true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'albanian-tech-pros') THEN
        INSERT INTO organizations (name, slug, description, organization_type, country, city, website, is_public, is_verified)
        VALUES ('Albanian Tech Professionals', 'albanian-tech-pros', 'A global network of Albanian software engineers, designers, and founders.', 'Association', 'United Kingdom', 'London', 'https://example.com', true, false);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'vatra') THEN
        INSERT INTO organizations (name, slug, description, organization_type, country, city, website, is_public, is_verified)
        VALUES ('Vatra', 'vatra', 'The Pan-Albanian Federation of America.', 'Association', 'United States', 'New York', 'https://vatrafederation.org', true, true);
    END IF;
END $$;
