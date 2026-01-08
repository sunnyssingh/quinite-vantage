-- Create projects table for storing real-estate projects

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  image_path TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  address TEXT,
  project_type TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_image_path ON projects(image_path);

-- Basic RLS policy examples (enable RLS first if desired)
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Org members can select projects" ON projects FOR SELECT
-- USING (
--   organization_id IN (
--     SELECT organization_id FROM profiles WHERE id = auth.uid()
--   )
-- );
--
-- CREATE POLICY "Org members can insert projects" ON projects FOR INSERT
-- WITH CHECK (
--   organization_id = (
--     SELECT organization_id FROM profiles WHERE id = auth.uid()
--   )
-- );

-- Example additional policies for update/delete (require same org and optionally ownership)
-- CREATE POLICY "Org members can update their projects" ON projects FOR UPDATE
-- USING (
--   organization_id = (
--     SELECT organization_id FROM profiles WHERE id = auth.uid()
--   )
-- )
-- WITH CHECK (
--   organization_id = (
--     SELECT organization_id FROM profiles WHERE id = auth.uid()
--   )
-- );
--
-- CREATE POLICY "Org members can delete their projects" ON projects FOR DELETE
-- USING (
--   organization_id = (
--     SELECT organization_id FROM profiles WHERE id = auth.uid()
--   )
-- );

-- Optional: trigger to keep `updated_at` current on row updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at ON projects;
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
