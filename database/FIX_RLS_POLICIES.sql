-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view projects in own org" ON projects;
DROP POLICY IF EXISTS "Users can insert projects in own org" ON projects;
DROP POLICY IF EXISTS "Users can update projects in own org" ON projects;
DROP POLICY IF EXISTS "Users can delete projects in own org" ON projects;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING ( auth.uid() = id );

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING ( auth.uid() = id );

-- PROJECTS POLICIES
-- View
CREATE POLICY "Users can view projects in own org"
ON projects FOR SELECT
TO authenticated
USING (
  organization_id = (
    SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1
  )
);

-- Insert
CREATE POLICY "Users can insert projects in own org"
ON projects FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (
    SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1
  )
);

-- Update
CREATE POLICY "Users can update projects in own org"
ON projects FOR UPDATE
TO authenticated
USING (
  organization_id = (
    SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1
  )
);

-- Delete
CREATE POLICY "Users can delete projects in own org"
ON projects FOR DELETE
TO authenticated
USING (
  organization_id = (
    SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1
  )
);
