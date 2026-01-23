/**
 * Quick Fix Script for RLS Infinite Recursion
 * This script will automatically fix the profiles table RLS policies
 */

const { createClient } = require('@supabase/supabase-js')

// Get credentials from environment or use these
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const fixSQL = `
-- Drop ALL existing policies on profiles table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
    END LOOP;
END $$;

-- Create simple, non-recursive policies
CREATE POLICY "view_own_profile"
ON profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "view_org_profiles"  
ON profiles FOR SELECT TO authenticated
USING (
  organization_id = (
    SELECT p.organization_id 
    FROM profiles p
    WHERE p.id = auth.uid()
    LIMIT 1
  )
);

CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);
`

async function runFix() {
    console.log('🔧 Fixing RLS policies...\n')

    try {
        // Note: This requires the SQL to be run via Supabase Dashboard
        // The Supabase JS client doesn't support raw SQL execution

        console.log('❌ Cannot execute SQL directly via Supabase JS client')
        console.log('\n📋 Please copy this SQL and run it in Supabase SQL Editor:\n')
        console.log('='.repeat(60))
        console.log(fixSQL)
        console.log('='.repeat(60))
        console.log('\n✅ After running the SQL, refresh your Organization Settings page')

    } catch (error) {
        console.error('Error:', error.message)
    }
}

runFix()
