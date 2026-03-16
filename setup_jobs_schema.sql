-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL, -- references public.organizations(id)
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    type VARCHAR(50) DEFAULT 'full_time' CHECK (type IN ('full_time', 'part_time', 'contract', 'internship')),
    is_remote BOOLEAN DEFAULT false,
    salary_range VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: The "Talent Bench" relies on the `open_to_work` boolean already present in the `profile` table.
-- No new schema is needed for the Talent Bench, just queries against existing data.

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_org ON public.jobs(organization_id);
