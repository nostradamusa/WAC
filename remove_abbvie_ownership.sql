-- Remove Ownership of Abbvie from the primary user
DO $$ 
DECLARE
  v_user_id uuid;
  v_abbvie_id uuid;
BEGIN
  -- 1. Safely locate your user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'albanm1687@gmail.com' LIMIT 1;

  -- Fallback if your email is different, just grab the first admin account
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE LOG 'No users found in auth.users!';
    RETURN;
  END IF;

  -- 2. Locate Abbvie (Business)
  SELECT id INTO v_abbvie_id FROM public.businesses WHERE name ILIKE '%Abbvie%' LIMIT 1;

  IF v_abbvie_id IS NOT NULL THEN
    -- Remove ownership
    UPDATE public.businesses SET owner_id = NULL WHERE id = v_abbvie_id;
    RAISE LOG 'Successfully removed AbbVie ownership from user %', v_user_id;
  ELSE
    RAISE LOG 'AbbVie not found in the businesses table.';
  END IF;

END $$;
