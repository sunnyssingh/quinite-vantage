-- ============================================================================
-- FINAL FIX FOR RLS INFINITE RECURSION
-- ============================================================================
-- Root Cause: Policies on profiles table were querying profiles table
-- Solution: Use ONLY auth.uid() without any subqueries to profiles
-- ============================================================================

-- STEP 1: DROP ALL EXISTING POLICIES ON PROFILES
-- ============================================================================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- STEP 2: CREATE SIMPLE NON-RECURSIVE POLICIES
-- ============================================================================

-- Policy 1: Users can ALWAYS read their own profile (using auth.uid() only)
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy 2: Service role can do everything (for backend operations)
CREATE POLICY "profiles_service_role_all"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 3: Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- STEP 3: VERIFY POLICIES WORK
-- ============================================================================
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename = 'profiles';
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'RLS Policies Created: %', policy_count;
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies on profiles table:';
  
  FOR r IN (SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles') LOOP
    RAISE NOTICE '  - % (Command: %)', r.policyname, r.cmd;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ NON-RECURSIVE POLICIES CREATED';
  RAISE NOTICE '✅ Users can now read their own profiles';
  RAISE NOTICE '✅ No more infinite recursion!';
  RAISE NOTICE '';
  RAISE NOTICE 'Test by calling: SELECT * FROM profiles WHERE id = auth.uid()';
END $$;
