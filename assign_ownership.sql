-- Assign Ownership of WAC and Abbvie to the primary user
DO $$ 
DECLARE
  v_user_id uuid;
  v_wac_id uuid;
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

  -- 2. Link World Albanian Congress (Organization)
  SELECT id INTO v_wac_id FROM public.organizations WHERE name ILIKE '%World Albanian Congress%' LIMIT 1;

  IF v_wac_id IS NULL THEN
    -- Insert it if it doesn't exist
    INSERT INTO public.organizations (name, slug, organization_type, description, is_verified, owner_id)
    VALUES ('World Albanian Congress', 'wac-official', 'Non-Profit', 'The official World Albanian Congress organization.', true, v_user_id)
    RETURNING id INTO v_wac_id;
  ELSE
    -- Update existing
    UPDATE public.organizations SET owner_id = v_user_id, is_verified = true WHERE id = v_wac_id;
  END IF;

  -- 3. Link Abbvie (Business)
  SELECT id INTO v_abbvie_id FROM public.businesses WHERE name ILIKE '%Abbvie%' LIMIT 1;

  IF v_abbvie_id IS NULL THEN
    -- Insert it if it doesn't exist (fixed column name: business_type)
    INSERT INTO public.businesses (name, slug, business_type, description, is_verified, owner_id)
    VALUES ('AbbVie', 'abbvie-pharma', 'Pharmaceuticals', 'A research-driven biopharmaceutical company.', true, v_user_id)
    RETURNING id INTO v_abbvie_id;
  ELSE
    -- Update existing
    UPDATE public.businesses SET owner_id = v_user_id, is_verified = true WHERE id = v_abbvie_id;
  END IF;

  RAISE LOG 'Successfully assigned WAC and AbbVie to user %', v_user_id;
END $$;
