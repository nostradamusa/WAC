-- Seed Mock Feed Posts to Test Algorithmic "For You" Feed vs Chronological "Following" Feed

-- Ensure we have some users to post as
DO $$
DECLARE
    user1 UUID;
    user2 UUID;
    user3 UUID;
    org1 UUID;
    biz1 UUID;
BEGIN
    -- 1. Grab random profiles to act as authors
    SELECT id INTO user1 FROM public.profiles WHERE username IS NOT NULL LIMIT 1 OFFSET 0;
    SELECT id INTO user2 FROM public.profiles WHERE username IS NOT NULL LIMIT 1 OFFSET 1;
    SELECT id INTO user3 FROM public.profiles WHERE username IS NOT NULL LIMIT 1 OFFSET 2;
    
    -- Grab a random org and biz
    SELECT id INTO org1 FROM public.organizations LIMIT 1;
    SELECT id INTO biz1 FROM public.businesses LIMIT 1;

    -- If we don't have enough users, exit gracefully without erroring the script but it won't seed much
    IF user1 IS NULL THEN RETURN; END IF;

    -- 2. Insert Viral / Top Liked Posts (Should appear at the TOP of 'For You', but lower down in 'Following' if they are old)
    INSERT INTO public.feed_posts (submitted_by, author_profile_id, content, likes_count, comments_count, created_at)
    VALUES 
    (user1, user1, 'Thrilled to announce that I will be speaking at the upcoming Global Albanian Tech Summit! Let''s connect if you are building in the AI space. 🇦🇱🚀', 1452, 89, NOW() - INTERVAL '3 days');

    INSERT INTO public.feed_posts (submitted_by, author_profile_id, content, likes_count, comments_count, created_at)
    VALUES 
    (COALESCE(user2, user1), COALESCE(user2, user1), 'Just wrapped up an incredible networking event in London. The energy in our community is absolutely unmatched. Can''t wait for the next one!', 890, 45, NOW() - INTERVAL '5 days');

    -- 3. Insert Recent posts with low engagement (Should appear at the TOP of 'Following', but lower down in 'For You')
    INSERT INTO public.feed_posts (submitted_by, author_profile_id, content, likes_count, comments_count, created_at)
    VALUES 
    (user1, user1, 'Does anyone know a good corporate tax accountant in Tirana? Asking for a friend starting a new venture there.', 2, 4, NOW() - INTERVAL '1 hour');

    INSERT INTO public.feed_posts (submitted_by, author_profile_id, content, likes_count, comments_count, created_at)
    VALUES 
    (COALESCE(user3, user1), COALESCE(user3, user1), 'Good morning network! Time to grind. ☕️', 8, 1, NOW() - INTERVAL '3 hours');

    -- 4. Insert posts from Organizations/Businesses
    IF org1 IS NOT NULL THEN
        INSERT INTO public.feed_posts (submitted_by, author_organization_id, content, likes_count, comments_count, post_type, created_at)
        VALUES 
        (user1, org1, 'We are officially launching our new mentorship program specifically for recent graduates. Apply using the link in our bio!', 340, 56, 'opportunity', NOW() - INTERVAL '1 day');
    END IF;

    IF biz1 IS NOT NULL THEN
        INSERT INTO public.feed_posts (submitted_by, author_business_id, content, likes_count, comments_count, post_type, created_at)
        VALUES 
        (user2, biz1, 'We are hiring! Looking for a Senior Full-Stack Engineer to join our growing team. Competitive salary and fully remote.', 125, 22, 'opportunity', NOW() - INTERVAL '2 days');
    END IF;

END $$;
