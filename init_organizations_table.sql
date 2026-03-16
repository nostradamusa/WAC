-- Create the organizations table if it does not exist
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    organization_type TEXT,
    country TEXT,
    state TEXT,
    city TEXT,
    website TEXT,
    contact_email TEXT,
    leader_name TEXT,
    is_public BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: Ensure RLS is enabled if not already
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow script reruns)
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
DROP POLICY IF EXISTS "Users can insert their own organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their own organizations" ON public.organizations;

-- Creating standard RLS policies
CREATE POLICY "Organizations are viewable by everyone" 
    ON public.organizations FOR SELECT 
    USING (is_public = true);

CREATE POLICY "Users can insert their own organizations" 
    ON public.organizations FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own organizations" 
    ON public.organizations FOR UPDATE 
    USING (auth.uid() = owner_id);
