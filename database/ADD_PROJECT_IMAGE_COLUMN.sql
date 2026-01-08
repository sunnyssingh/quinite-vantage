-- Migration: Add image_url and image_path columns to projects table

ALTER TABLE IF EXISTS projects
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_path TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_image_path ON projects(image_path);

-- Optionally set RLS policies for file ownership (example)
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Org members can insert projects with their own org id" ON projects FOR INSERT
-- WITH CHECK (
--   organization_id = (
--     SELECT organization_id FROM profiles WHERE id = auth.uid()
--   )
-- );
