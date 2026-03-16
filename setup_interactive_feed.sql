-- Comprehensive Schema for the Interactive Network Feed (Phase 6)

-- 1. Create the `feed_posts` table with Actor-based posting support
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- The core entity that submitted the post (always the authenticated user)
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Actor association (Poly-morphic via explicit columns for FK integrity)
  -- Exactly ONE of these three must be populated.
  author_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  author_organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  image_url TEXT,
  post_type VARCHAR(50) DEFAULT 'general', -- 'general', 'opportunity', 'ask'
  
  -- Denormalized counters for performance
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Only one actor can be the author
  CONSTRAINT single_author_check CHECK (
    (author_profile_id IS NOT NULL)::integer + 
    (author_business_id IS NOT NULL)::integer + 
    (author_organization_id IS NOT NULL)::integer = 1
  )
);

-- 2. Create the `feed_likes` table
CREATE TABLE IF NOT EXISTS public.feed_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.feed_posts(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- A user can only like a post once
  UNIQUE(post_id, profile_id)
);

-- 3. Create the `feed_comments` table
CREATE TABLE IF NOT EXISTS public.feed_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.feed_posts(id) ON DELETE CASCADE NOT NULL,
  
  -- The authenticated user who submitted the comment
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Support Actor-based commenting
  author_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  author_organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT single_comment_author_check CHECK (
    (author_profile_id IS NOT NULL)::integer + 
    (author_business_id IS NOT NULL)::integer + 
    (author_organization_id IS NOT NULL)::integer = 1
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author_profile ON public.feed_posts(author_profile_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author_business ON public.feed_posts(author_business_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author_organization ON public.feed_posts(author_organization_id);

CREATE INDEX IF NOT EXISTS idx_feed_comments_post_id ON public.feed_comments(post_id);

-- Database Triggers to auto-update likes_count and comments_count

-- LIKES TRIGGER
CREATE OR REPLACE FUNCTION update_feed_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_feed_likes_count ON public.feed_likes;
CREATE TRIGGER trigger_feed_likes_count
AFTER INSERT OR DELETE ON public.feed_likes
FOR EACH ROW EXECUTE FUNCTION update_feed_likes_count();


-- COMMENTS TRIGGER
CREATE OR REPLACE FUNCTION update_feed_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_feed_comments_count ON public.feed_comments;
CREATE TRIGGER trigger_feed_comments_count
AFTER INSERT OR DELETE ON public.feed_comments
FOR EACH ROW EXECUTE FUNCTION update_feed_comments_count();


-- Row Level Security (RLS)
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- Post Policies
CREATE POLICY "Feed posts are readable by everyone" ON public.feed_posts FOR SELECT USING (true);
CREATE POLICY "Users can create feed posts" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Users can update own feed posts" ON public.feed_posts FOR UPDATE USING (auth.uid() = submitted_by);
CREATE POLICY "Users can delete own feed posts" ON public.feed_posts FOR DELETE USING (auth.uid() = submitted_by);

-- Likes Policies
CREATE POLICY "Likes are readable by everyone" ON public.feed_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.feed_likes FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can unlike posts" ON public.feed_likes FOR DELETE USING (auth.uid() = profile_id);

-- Comments Policies
CREATE POLICY "Comments are readable by everyone" ON public.feed_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.feed_comments FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Users can update own comments" ON public.feed_comments FOR UPDATE USING (auth.uid() = submitted_by);
CREATE POLICY "Users can delete own comments" ON public.feed_comments FOR DELETE USING (auth.uid() = submitted_by);
