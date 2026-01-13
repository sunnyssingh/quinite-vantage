-- ============================================
-- AUTO-CREATE ORGANIZATION ON SIGNUP
-- ============================================

-- 1. Create or Replace the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  default_role_id UUID;
  user_name TEXT;
  org_name TEXT;
BEGIN
  -- Determine User Name
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  -- Determine Org Name (e.g. "John's Organization")
  org_name := split_part(user_name, '@', 1) || '''s Organization';

  -- A. Create Default Organization
  INSERT INTO public.organizations (name, onboarding_status)
  VALUES (org_name, 'PENDING')
  RETURNING id INTO new_org_id;

  -- B. Get Default Role ID (Client Super Admin)
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'Client Super Admin' LIMIT 1;

  -- C. Create Profile linked to new Org
  INSERT INTO public.profiles (id, email, full_name, avatar_url, organization_id, role_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    new_org_id,
    default_role_id
  );

  -- D. Create Initial Organization Profile (So Onboarding form has a name to edit)
  INSERT INTO public.organization_profiles (organization_id, company_name)
  VALUES (new_org_id, org_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-create Trigger (to ensure it uses the new function version if name changed, though here it's same name)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. BACKFILL for Existing Users who have Profiles but NO Organization
-- This uses a DO block to iterate and create orgs for easier logic
DO $$
DECLARE
  rec RECORD;
  new_org_id UUID;
  default_role_id UUID;
  org_name TEXT;
BEGIN
  -- Get default role
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'Client Super Admin' LIMIT 1;

  FOR rec IN SELECT * FROM public.profiles WHERE organization_id IS NULL LOOP
    
    -- Generate Org Name
    org_name := split_part(COALESCE(rec.full_name, rec.email), '@', 1) || '''s Organization';

    -- Create Org
    INSERT INTO public.organizations (name, onboarding_status)
    VALUES (org_name, 'PENDING')
    RETURNING id INTO new_org_id;

    -- Update Profile
    UPDATE public.profiles 
    SET organization_id = new_org_id,
        role_id = COALESCE(role_id, default_role_id)
    WHERE id = rec.id;

    -- Create Org Profile
    INSERT INTO public.organization_profiles (organization_id, company_name)
    VALUES (new_org_id, org_name)
    ON CONFLICT (organization_id) DO NOTHING;
    
  END LOOP;
END $$;
