-- 1. Create Network Posts Table
CREATE TABLE IF NOT EXISTS public.network_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'general', -- e.g., 'general', 'opportunity', 'ask'
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Network Comments Table
CREATE TABLE IF NOT EXISTS public.network_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.network_posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Network Likes Table
CREATE TABLE IF NOT EXISTS public.network_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.network_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id) -- Prevent duplicate likes from the same user on the same post
);

-- Note: Ensure RLS is enabled on all tables
ALTER TABLE public.network_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow script reruns)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.network_posts;
DROP POLICY IF EXISTS "Authenticated users can insert posts" ON public.network_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.network_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.network_posts;

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.network_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.network_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.network_comments;

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.network_likes;
DROP POLICY IF EXISTS "Authenticated users can toggle likes" ON public.network_likes;

-- Creating RLS policies for POSTS
CREATE POLICY "Posts are viewable by everyone" 
    ON public.network_posts FOR SELECT 
    USING (true);

-- We link the insert policy to auth.uid() matching the profile id.
CREATE POLICY "Authenticated users can insert posts" 
    ON public.network_posts FOR INSERT 
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" 
    ON public.network_posts FOR UPDATE 
    USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts" 
    ON public.network_posts FOR DELETE 
    USING (auth.uid() = author_id);

-- Creating RLS policies for COMMENTS
CREATE POLICY "Comments are viewable by everyone" 
    ON public.network_comments FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can insert comments" 
    ON public.network_comments FOR INSERT 
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" 
    ON public.network_comments FOR DELETE 
    USING (auth.uid() = author_id);

-- Creating RLS policies for LIKES
CREATE POLICY "Likes are viewable by everyone" 
    ON public.network_likes FOR SELECT 
    USING (true);

CREATE POLICY "Authenticated users can toggle likes" 
    ON public.network_likes FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
