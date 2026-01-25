-- ==============================================================================
-- FIX AUTH TRIGGER - Set role to NULL on signup (not 'employee')
-- ==============================================================================
-- This allows /api/onboard to properly set the role to 'super_admin'
-- ==============================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- Recreate function with role = NULL
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    NULL  -- ← Don't set role here, let /api/onboard set it to 'super_admin'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Success message
SELECT '✅ Auth trigger updated! New signups will have role = NULL until /api/onboard sets it to super_admin' as status;
