-- Mass Seed of Global Skills Database
-- This script ensures no duplicates by checking slugs before insertion

CREATE OR REPLACE FUNCTION slugify(value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(value, '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$ 
DECLARE
    skill_rec record;
    v_slug text;
BEGIN
    FOR skill_rec IN SELECT * FROM (VALUES 
        -- Technology & Engineering
        ('Software Engineering', 'Technology'),
        ('React.js', 'Technology'),
        ('Next.js', 'Technology'),
        ('TypeScript', 'Technology'),
        ('Python', 'Technology'),
        ('Data Science', 'Technology'),
        ('Machine Learning', 'Technology'),
        ('Artificial Intelligence', 'Technology'),
        ('Cloud Architecture', 'Technology'),
        ('AWS', 'Technology'),
        ('Cybersecurity', 'Technology'),
        ('System Administration', 'Technology'),
        ('DevOps', 'Technology'),
        ('UI/UX Design', 'Technology'),
        ('Product Management', 'Technology'),
        ('Agile Methodologies', 'Technology'),

        -- Healthcare & Medicine
        ('Clinical Research', 'Healthcare'),
        ('Patient Care', 'Healthcare'),
        ('Healthcare Management', 'Healthcare'),
        ('Medical Devices', 'Healthcare'),
        ('Pharmaceutical Sales', 'Healthcare'),
        ('Pharmacovigilance', 'Healthcare'),
        ('Public Health', 'Healthcare'),
        ('Biotechnology', 'Healthcare'),
        ('Nursing', 'Healthcare'),
        ('Surgery', 'Healthcare'),
        ('Dentistry', 'Healthcare'),
        ('Medical Imaging', 'Healthcare'),
        ('Health Informatics', 'Healthcare'),

        -- Business & Finance
        ('Financial Modeling', 'Finance'),
        ('Investment Banking', 'Finance'),
        ('Venture Capital', 'Finance'),
        ('Private Equity', 'Finance'),
        ('Accounting', 'Finance'),
        ('Corporate Finance', 'Finance'),
        ('Risk Management', 'Finance'),
        ('Wealth Management', 'Finance'),
        ('Business Development', 'Business'),
        ('Strategic Planning', 'Business'),
        ('Operations Management', 'Business'),
        ('Supply Chain Management', 'Business'),
        ('B2B Sales', 'Business'),
        ('Account Management', 'Business'),
        ('Entrepreneurship', 'Business'),
        ('Leadership', 'Business'),

        -- Law & Policy
        ('Corporate Law', 'Law'),
        ('Intellectual Property', 'Law'),
        ('Litigation', 'Law'),
        ('Real Estate Law', 'Law'),
        ('International Law', 'Law'),
        ('Immigration Law', 'Law'),
        ('Contract Negotiation', 'Law'),
        ('Public Policy', 'Law'),
        ('Government Relations', 'Law'),
        ('Diplomacy', 'Law'),

        -- Creative & Media
        ('Graphic Design', 'Creative'),
        ('Video Production', 'Creative'),
        ('Content Marketing', 'Creative'),
        ('Social Media Management', 'Creative'),
        ('Copywriting', 'Creative'),
        ('Journalism', 'Creative'),
        ('Public Relations', 'Creative'),
        ('Brand Strategy', 'Creative'),
        ('Digital Marketing', 'Creative'),
        ('SEO', 'Creative'),

        -- Real Estate & Construction
        ('Commercial Real Estate', 'Real Estate'),
        ('Residential Real Estate', 'Real Estate'),
        ('Property Management', 'Real Estate'),
        ('Real Estate Development', 'Real Estate'),
        ('Construction Management', 'Construction'),
        ('Architecture', 'Construction'),
        ('Civil Engineering', 'Construction'),
        ('Project Estimation', 'Construction'),

        -- Education & Research
        ('Higher Education', 'Education'),
        ('Curriculum Development', 'Education'),
        ('Academic Research', 'Education'),
        ('E-Learning', 'Education'),
        ('Instructional Design', 'Education'),

        -- Miscellaneous / Soft Skills
        ('Public Speaking', 'Soft Skills'),
        ('Bilingual', 'Soft Skills'),
        ('Albanian Language', 'Soft Skills'),
        ('Cross-functional Team Leadership', 'Soft Skills'),
        ('Negotiation', 'Soft Skills'),
        ('Event Planning', 'Soft Skills'),
        ('Fundraising', 'Soft Skills')
    ) AS v(name, category)
    LOOP
        v_slug := slugify(skill_rec.name);
        
        -- Insert if it doesn't already exist
        IF NOT EXISTS (SELECT 1 FROM public.skills WHERE slug = v_slug) THEN
            INSERT INTO public.skills (name, slug, category)
            VALUES (skill_rec.name, v_slug, skill_rec.category);
        END IF;
    END LOOP;
END $$;
